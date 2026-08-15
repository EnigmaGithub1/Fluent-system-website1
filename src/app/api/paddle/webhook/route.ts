// src/app/api/paddle/webhook/route.ts
//
// The authoritative fulfillment endpoint (master prompt sections 25-26).
// Nothing in this app grants product access except this route, and only
// after signature verification succeeds.
//
// Flow:
//   1. Read the RAW request body (required for signature verification —
//      see lib/paddle/webhook.ts for why this must happen before parsing).
//   2. Verify the Paddle-Signature header.
//   3. Check the WebhookEvent idempotency ledger — if we've already
//      processed this event_id, acknowledge and stop (no duplicate
//      order, no duplicate email).
//   4. Confirm the event type and transaction status actually indicate
//      a completed payment.
//   5. Resolve which internal product was purchased from the Paddle
//      price id (never trust a product id passed by the client).
//   6. Upsert the customer, create the order, grant access, issue a
//      download token, send the confirmation email.
//   7. Record the event as processed.
//
// Always returns 200 once the payload has been durably recorded, even
// if a downstream step (e.g. email) fails — so Paddle doesn't retry
// indefinitely for a problem retrying won't fix. Failures are logged
// and reflected in Order.emailStatus for manual follow-up instead.

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
    // Already handled this exact event. Paddle can safely retry deliveries;
    // acknowledging without reprocessing is what keeps duplicate delivery
    // from creating a duplicate order or a duplicate email.
    return NextResponse.json({ received: true, deduplicated: true });
  }

  // Record the event up front (even before we know if we can fully
  // process it) so we have an audit trail either way.
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

  // We only act on transaction completion events. Everything else
  // (e.g. transaction.created for a not-yet-paid checkout) is
  // acknowledged but ignored — see HANDLED_EVENT_TYPES.
  if (!HANDLED_EVENT_TYPES.includes(event.event_type as (typeof HANDLED_EVENT_TYPES)[number])) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const txn = event.data;
  if (txn.status !== 'completed' && txn.status !== 'paid') {
    // e.g. a failed or canceled transaction notification — do not grant access.
    return NextResponse.json({ received: true, status: txn.status });
  }

  try {
    await fulfillOrder(event, txn);
    await db.webhookEvent.update({ where: { id: event.event_id }, data: { processedOk: true } });
    return NextResponse.json({ received: true, fulfilled: true });
  } catch (err) {
    // Leave processedOk=false so a retried delivery (or a manual
    // reconciliation job) can attempt this again later.
    console.error('[paddle:webhook] fulfillment failed:', err);
    return NextResponse.json({ received: true, fulfillmentError: true }, { status: 200 });
    // Note: we still return 200 here rather than 500. A 500 would make
    // Paddle retry the SAME payload indefinitely even if the failure is
    // a permanent bug (e.g. an unmapped price id), which just spams
    // logs without fixing anything. Real operators should alert on
    // `fulfillmentError` in their own monitoring rather than relying on
    // Paddle's retry behavior to surface it.
  }
}

async function fulfillOrder(event: PaddleWebhookEvent, txn: PaddleWebhookEvent['data']) {
  // Guard against a delivery for a transaction we've somehow already
  // recorded (belt-and-suspenders alongside the WebhookEvent ledger).
  const alreadyRecorded = await findOrderByTransactionId(txn.id);
  if (alreadyRecorded) return;

  const priceId = txn.items?.[0]?.price?.id;
  if (!priceId) throw new Error(`Transaction ${txn.id} has no line-item price id.`);

  const product = getProductByPaddlePriceId(priceId);
  if (!product) {
    throw new Error(
      `No configured product matches Paddle price id "${priceId}". ` +
        `Check PADDLE_FLUENT_PRICE_ID / PADDLE_COMPLETE_PRICE_ID against your Paddle dashboard.`
    );
  }

  const email = txn.customer_details?.email || txn.customer?.email;
  if (!email) throw new Error(`Transaction ${txn.id} has no customer email.`);

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
    amount: (Number(total) / 100).toFixed(2), // Paddle amounts are in the currency's smallest unit
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

// Paddle webhooks are POST-only; explicitly reject other methods so the
// route doesn't silently 404 in a confusing way during setup/testing.
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint only accepts POST requests from Paddle.' },
    { status: 405 }
  );
}
