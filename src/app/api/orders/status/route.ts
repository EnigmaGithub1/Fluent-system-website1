// src/app/api/orders/status/route.ts
//
// Backs the thank-you page's polling loop. Paddle's client-side
// `checkout.completed` event fires the instant payment succeeds in the
// browser, but that is a UX signal only — see master prompt section 3.
// The thank-you page polls this endpoint, which reports fulfillment
// ONLY once our webhook handler has verified the transaction and
// created the order. This is what "the backend must independently
// verify payment status" means in practice.

import { NextResponse } from 'next/server';
import { findOrderByTransactionId } from '@/lib/orders';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transaction_id');

  if (!transactionId) {
    return NextResponse.json({ error: 'transaction_id query param is required.' }, { status: 400 });
  }

  const order = await findOrderByTransactionId(transactionId);

  if (!order) {
    // Webhook hasn't landed yet (usually a matter of seconds) — the
    // frontend should keep polling rather than treat this as failure.
    return NextResponse.json({ status: 'pending' });
  }

  if (order.paymentStatus !== 'paid') {
    return NextResponse.json({ status: order.paymentStatus });
  }

  return NextResponse.json({
    status: 'paid',
    order: {
      id: order.id,
      productName: order.productName,
      customerEmail: order.customerEmail,
      downloadAccessId: order.downloadAccessId,
    },
  });
}
