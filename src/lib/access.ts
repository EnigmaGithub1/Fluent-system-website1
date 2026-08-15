// src/lib/access.ts
//
// Access-control layer (see master prompt section 29). This is the
// single source of truth for "what does this customer actually own" —
// pages and download endpoints check here, never by inferring
// ownership from an order row directly.

import { db } from '@/lib/db';
import { getProduct, type InternalProductId } from '@/lib/products';

/**
 * Grants access to every product implied by a purchase (e.g. buying
 * FLUENT COMPLETE grants both `fluent` and `fluent_complete`). Uses
 * upsert so re-processing the same order (shouldn't happen, but
 * defense in depth) never creates duplicate grants or errors.
 */
export async function grantAccessForPurchase(customerId: string, purchasedProductId: InternalProductId, orderId: string) {
  const product = getProduct(purchasedProductId);

  await Promise.all(
    product.grants.map((grantedProductId) =>
      db.productAccess.upsert({
        where: {
          customerId_internalProductId: {
            customerId,
            internalProductId: grantedProductId,
          },
        },
        create: {
          customerId,
          internalProductId: grantedProductId,
          grantedByOrderId: orderId,
        },
        update: {
          // Already had it (e.g. bought FLUENT, later bought COMPLETE which
          // also grants `fluent`) — leave the original grant date alone,
          // nothing to do.
        },
      })
    )
  );
}

export async function getCustomerAccess(customerId: string): Promise<InternalProductId[]> {
  const rows = await db.productAccess.findMany({ where: { customerId } });
  return rows.map((r) => r.internalProductId as InternalProductId);
}

export async function customerHasAccess(customerId: string, productId: InternalProductId): Promise<boolean> {
  const row = await db.productAccess.findUnique({
    where: { customerId_internalProductId: { customerId, internalProductId: productId } },
  });
  return Boolean(row);
}

/** Convenience check used by the /download page and the download API route. */
export async function assertAccessOrThrow(customerId: string, productId: InternalProductId) {
  const hasAccess = await customerHasAccess(customerId, productId);
  if (!hasAccess) {
    throw new Error(`Customer ${customerId} does not have access to ${productId}`);
  }
}
