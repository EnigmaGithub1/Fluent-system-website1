// src/lib/products.ts
//
// Centralized product configuration (see master prompt section 5).
// Every part of the app — checkout, webhook handler, access control,
// download page, emails — reads product info from here rather than
// hardcoding names, prices, or IDs in multiple places.
//
// IMPORTANT: `displayPrice` is for UI display ONLY. The actual amount
// charged is always determined by Paddle from the price ID — the
// frontend never sends a dollar amount to Paddle or to our own backend.

export type InternalProductId = 'fluent' | 'fluent_complete';

export interface ProductConfig {
  internalProductId: InternalProductId;
  name: string;
  tagline: string;
  displayPrice: string; // formatted for UI, e.g. "$24.99"
  currency: string;
  /**
   * The Paddle Price ID for this product (NOT the Product ID — Paddle
   * checkouts are opened against a price). This must be created by you
   * in the Paddle Sandbox dashboard first. See PADDLE_SETUP.md.
   * Left empty until you provide it — the app will show a clear
   * "not configured" state rather than silently failing.
   */
  paddlePriceId: string;
  /** Which products this purchase unlocks access to. */
  grants: InternalProductId[];
  /** Filename of the deliverable this product maps to in storage. */
  downloadPackage: string;
  emailTag: string;
}

export const PRODUCTS: Record<InternalProductId, ProductConfig> = {
  fluent: {
    internalProductId: 'fluent',
    name: 'FLUENT',
    tagline: 'A Practical System for Social Confidence & Connection',
    displayPrice: '$24.99',
    currency: 'USD',
    paddlePriceId: process.env.PADDLE_FLUENT_PRICE_ID || '',
    grants: ['fluent'],
    downloadPackage: 'FLUENT-Social-Fluency-System.pdf',
    emailTag: 'FLUENT_CUSTOMER',
  },
  fluent_complete: {
    internalProductId: 'fluent_complete',
    name: 'FLUENT COMPLETE',
    tagline: 'The Social Fluency Training System',
    displayPrice: '$39.99',
    currency: 'USD',
    paddlePriceId: process.env.PADDLE_COMPLETE_PRICE_ID || '',
    // Buying Complete grants both — see instructions section 29.
    grants: ['fluent', 'fluent_complete'],
    downloadPackage: 'FLUENT_COMPLETE.zip',
    emailTag: 'FLUENT_COMPLETE_CUSTOMER',
  },
};

export function getProduct(id: InternalProductId): ProductConfig {
  const product = PRODUCTS[id];
  if (!product) throw new Error(`Unknown product id: ${id}`);
  return product;
}

/** Look up a product by its configured Paddle price ID (used by the webhook handler). */
export function getProductByPaddlePriceId(paddlePriceId: string): ProductConfig | undefined {
  return Object.values(PRODUCTS).find((p) => p.paddlePriceId === paddlePriceId);
}

/** True once a real Paddle price ID has been supplied for this product. */
export function isProductConfigured(id: InternalProductId): boolean {
  return Boolean(PRODUCTS[id].paddlePriceId);
}

export const ALL_PRODUCTS = Object.values(PRODUCTS);
