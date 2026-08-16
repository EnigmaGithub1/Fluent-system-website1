// src/app/api/paddle/webhook/route.ts
//
// The authoritative fulfillment endpoint (master prompt sections 25-26)
// with Paddle API integration to fetch customer email when not in webhook.
//
// Flow:
//   1. Read the RAW request body (required for signature verification)
//   2. Verify the Paddle-Signature header
//   3. Check the WebhookEvent idempotency ledger
//   4. Confirm event type and transaction status indicate completed payment
//   5. Resolve which internal product was purchased from Paddle price id
//   6. FETCH CUSTOMER EMAIL from Paddle's API if not in webhook payload
//   7. Upsert customer, create order, grant access, issue download token, send email
//   8. Record the event as processed

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPaddleWebhook,
  WebhookVerificationError,
  HANDLED_EVENT_TYPES,
  type PaddleWebhookEvent,
} from '@/lib/paddle/webhook';
import { getProductByPaddlePriceId } from '@/lib/products';
import { upsertCustomer } from '@/lib/customers';
import { createOrder, findOrderByTransactionId, markOrderEmailSent, attachDownloadAccessId } from '@/lib/orders';
import { grantAccessForPurchase } from '@/lib/access';
import { issueDownloadToken } from '@/lib/download';
import { sendPurchaseConfirmation, tagCustomer } from '@/lib/email/service';

// Fetch customer details from Paddle's API
async function getPaddleCustomer(customerId: string) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY is not configured');
  }

  try {
    const response = await fetch(`https://api.paddle.com/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data; // Paddle API returns { data: {...} }
  } catch (err) {
    console.error(`[paddle:api] Failed to fetch customer ${customerId}:`, err);
    throw new Error(`Could not fetch customer details from Paddle: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('paddle-signature');
  const secret = process.env.PADDLE_WEBHOOK_SECRET || '';

  let event: PaddleWebhookEvent;
  try {
    event = verifyPaddleWebhook<PaddleWebhookEvent>(rawBody, signature, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn('[paddle:webhook] verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.error('[paddle:webhook] unexpected verification error:', err);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // --- Idempotency check -------------------------------------------------
  const existingEvent = await db.webhookEvent.findUnique({ where: { id: event.event_id } });
  if (existingEvent?.processedOk) {
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // Record the event up front
  await db.webhookEvent.upsert({
    where: { id: event.event_id },
    create: {
      id: event.event_id,
      eventType: event.event_type,
      rawPayload: rawBody,
      processedOk: false,
    },
    update: { rawPayload: rawBody },
  });

  // Only act on transaction completion events
  if (!HANDLED_EVENT_TYPES.includes(event.event_type as (typeof HANDLED_EVENT_TYPES)[number])) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const txn = event.data;
  if (txn.status !== 'completed' && txn.status !== 'paid') {
    return NextResponse.json({ received: true, status: txn.status });
  }

  try {
    await fulfillOrder(event, txn);
    await db.webhookEvent.update({ where: { id: event.event_id }, data: { processedOk: true } });
    return NextResponse.json({ received: true, fulfilled: true });
  } catch (err) {
    console.error('[paddle:webhook] fulfillment failed:', err);
    return NextResponse.json({ received: true, fulfillmentError: true }, { status: 200 });
  }
}

async function fulfillOrder(event: PaddleWebhookEvent, txn: PaddleWebhookEvent['data']) {
  // Guard against duplicate order
  const alreadyRecorded = await findOrderByTransactionId(txn.id);
  if (alreadyRecorded) return;

  const priceId = txn.items?.[0]?.price?.id;
  if (!priceId) throw new Error(`Transaction ${txn.id} has no line-item price id.`);

  const product = getProductByPaddlePriceId(priceId);
  if (!product) {
    throw new Error(
      `No configured product matches Paddle price id "${priceId}". Check your environment variables.`
    );
  }

  // Try to get email from webhook payload first
  let email = txn.customer_details?.email || txn.customer?.email;

  // If not in webhook, fetch from Paddle API using customer_id
  if (!email && txn.customer_id) {
    const paddleCustomer = await getPaddleCustomer(txn.customer_id);
    email = paddleCustomer?.email;
  }

  if (!email) {
    throw new Error(`Transaction ${txn.id} has no customer email (not in webhook or Paddle API response).`);
  }

  const customer = await upsertCustomer({
    email,
    firstName: txn.customer_details?.first_name,
    lastName: txn.customer_details?.last_name,
    paddleCustomerId: txn.customer_id,
  });

  const total = txn.details?.totals?.total || txn.items[0]?.totals?.total || '0';

  const order = await createOrder({
    paddleTransactionId: txn.id,
    paddleCustomerId: txn.customer_id,
    customerId: customer.id,
    customerEmail: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    internalProductId: product.internalProductId,
    paddlePriceId: priceId,
    productName: product.name,
    amount: (Number(total) / 100).toFixed(2),
    currency: txn.currency_code,
    paymentStatus: 'paid',
  });

  await grantAccessForPurchase(customer.id, product.internalProductId, order.id);
  await tagCustomer(customer.email, product.emailTag);

  const { token } = await issueDownloadToken(customer.id, product.internalProductId);
  await attachDownloadAccessId(order.id, token);

  const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${token}`;
  const emailResult = await sendPurchaseConfirmation({ ...order, downloadAccessId: token }, downloadUrl);
  await markOrderEmailSent(order.id, emailResult.ok ? 'sent' : 'failed');
}

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests from Paddle.' },
    { status: 405 }
  );
}
