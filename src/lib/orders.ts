// src/lib/orders.ts
//
// Order record operations (see master prompt section 27). Orders are
// created/updated exclusively from the verified webhook handler —
// never from the frontend success redirect (see webhook route for why).

import { db } from '@/lib/db';
import type { Order } from '@prisma/client';
import type { InternalProductId } from '@/lib/products';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';

export interface CreateOrderInput {
  paddleTransactionId: string;
  paddleCustomerId: string | null;
  customerId: string;
  customerEmail: string;
  firstName?: string | null;
  lastName?: string | null;
  internalProductId: InternalProductId;
  paddlePriceId: string;
  productName: string;
  amount: string;
  currency: string;
  paymentStatus: PaymentStatus;
}

/** Returns the existing order for a Paddle transaction id, if we've already recorded it. */
export async function findOrderByTransactionId(paddleTransactionId: string): Promise<Order | null> {
  return db.order.findUnique({ where: { paddleTransactionId } });
}

/**
 * Creates the order row for a newly completed transaction. Idempotency
 * against duplicate webhook delivery is handled one level up, in
 * webhook/route.ts, via the WebhookEvent ledger — but we also guard
 * here with the unique constraint on paddleTransactionId as a second
 * line of defense.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  return db.order.create({
    data: {
      paddleTransactionId: input.paddleTransactionId,
      paddleCustomerId: input.paddleCustomerId,
      customerId: input.customerId,
      customerEmail: input.customerEmail,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      internalProductId: input.internalProductId,
      paddlePriceId: input.paddlePriceId,
      productName: input.productName,
      amount: input.amount,
      currency: input.currency,
      paymentStatus: input.paymentStatus,
      completedAt: input.paymentStatus === 'paid' ? new Date() : null,
    },
  });
}

export async function markOrderEmailSent(orderId: string, status: 'sent' | 'failed') {
  return db.order.update({
    where: { id: orderId },
    data: { emailStatus: status, emailSentAt: status === 'sent' ? new Date() : undefined },
  });
}

export async function attachDownloadAccessId(orderId: string, downloadAccessId: string) {
  return db.order.update({ where: { id: orderId }, data: { downloadAccessId } });
}

export async function getOrdersForCustomer(customerId: string): Promise<Order[]> {
  return db.order.findMany({
    where: { customerId, paymentStatus: 'paid' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  return db.order.findUnique({ where: { id: orderId } });
}
