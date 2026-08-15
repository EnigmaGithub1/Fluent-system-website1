// src/lib/paddle/client.ts
//
// Client-side Paddle integration, isolated behind a small abstraction
// (paymentService) per master prompt section 24. Nothing outside this
// file should import '@paddle/paddle-js' directly.
//
// Verified against current Paddle.js v2 / @paddle/paddle-js docs
// (developer.paddle.com/paddle-js, npmjs.com/package/@paddle/paddle-js):
//   initializePaddle({ environment, token }) -> Promise<Paddle | undefined>
//   paddle.Checkout.open({ items, settings, customer, customData })
'use client';

import { initializePaddle, type Paddle, type CheckoutEventsData } from '@paddle/paddle-js';
import type { InternalProductId } from '@/lib/products';
import { getProduct } from '@/lib/products';
import { trackEvent } from '@/lib/analytics';

let paddleInstance: Paddle | undefined;
let initPromise: Promise<Paddle | undefined> | null = null;

type PaddleEnv = 'sandbox' | 'production';

function getEnv(): PaddleEnv {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
  return env === 'production' ? 'production' : 'sandbox';
}

/**
 * Loads and initializes Paddle.js exactly once, from Paddle's own CDN
 * (never self-hosted — required by Paddle for security/compliance).
 * Safe to call multiple times; subsequent calls reuse the same instance.
 */
export function getPaddle(onCheckoutEvent?: (event: CheckoutEventsData) => void): Promise<Paddle | undefined> {
  if (initPromise) return initPromise;

  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) {
    console.error(
      '[paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set. ' +
        'Checkout cannot open until this is configured — see PADDLE_SETUP.md.'
    );
    return Promise.resolve(undefined);
  }

  initPromise = initializePaddle({
    environment: getEnv(),
    token,
    eventCallback: (event) => {
      if (onCheckoutEvent) onCheckoutEvent(event as any);
      handlePaddleEvent(event as any);
    },
  }).then((instance) => {
    paddleInstance = instance;
    return instance;
  });

  return initPromise;
}

function handlePaddleEvent(event: CheckoutEventsData) {
  // Central place to react to Paddle's client-side checkout lifecycle.
  // IMPORTANT: these events are UX signals only. They must never be
  // treated as proof of payment — that authority lives exclusively in
  // the verified server-side webhook (see lib/paddle/webhook.ts).
  switch ((event as any).name) {
    case 'checkout.loaded':
      trackEvent('checkout_started', { items: (event as any).data?.items });
      break;
    case 'checkout.completed': {
      // Optimistic UX only. We navigate to /thank-you carrying the
      // transaction id so it can poll our backend — the page itself
      // only reports success once the webhook has actually landed.
      // (We navigate manually here rather than relying on Paddle's
      // `successUrl` templating, so we control exactly which query
      // params land on the page regardless of overlay vs redirect mode.)
      trackEvent('checkout_completed_client', { transactionId: (event as any).data?.transaction_id });
      const txnId = (event as any).data?.transaction_id;
      const productId = ((event as any).data?.custom_data as { internal_product_id?: string } | undefined)
        ?.internal_product_id;
      if (txnId && typeof window !== 'undefined') {
        const url = new URL('/thank-you', window.location.origin);
        url.searchParams.set('transaction_id', txnId);
        if (productId) url.searchParams.set('product', productId);
        window.location.href = url.toString();
      }
      break;
    }
    case 'checkout.error':
      trackEvent('checkout_error', { error: (event as any).data });
      break;
    default:
      break;
  }
}

export interface OpenCheckoutOptions {
  productId: InternalProductId;
  email?: string;
  firstName?: string;
  lastName?: string;
  onEvent?: ((event as any): CheckoutEventsData) => void;
}

/**
 * Opens a Paddle overlay checkout for the given internal product.
 * The Paddle Price ID is resolved server-side (via products.ts config),
 * never hardcoded in a component — this is what prevents a client from
 * tampering with which price gets charged.
 */
export async function createCheckout({ productId, email, firstName, lastName, onEvent }: OpenCheckoutOptions) {
  const product = getProduct(productId);

  if (!product.paddlePriceId) {
    throw new Error(
      `${product.name} has no Paddle price ID configured yet. ` +
        `Set PADDLE_${productId.toUpperCase()}_PRICE_ID / NEXT_PUBLIC equivalent — see PADDLE_SETUP.md.`
    );
  }

  const paddle = await getPaddle(onEvent);
  if (!paddle) {
    throw new Error('Paddle failed to initialize. Check NEXT_PUBLIC_PADDLE_CLIENT_TOKEN and network access.');
  }

  paddle.Checkout.open({
    items: [{ priceId: product.paddlePriceId, quantity: 1 }],
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: 'en',
      // We handle the post-payment redirect ourselves in handlePaddleEvent
      // (checkout.completed), where we have the actual transaction id to
      // pass along. successUrl is intentionally omitted so Paddle doesn't
      // also try to navigate on its own with different query params.
    },
    // Prefilling customer info speeds up checkout; Paddle still
    // requires/validates the email itself before allowing payment.
    ...(email
      ? {
          customer: { email, ...(firstName || lastName ? { name: `${firstName ?? ''} ${lastName ?? ''}`.trim() } : {}) },
        }
      : {}),
    customData: {
      internal_product_id: productId,
    },
  });

  trackEvent('checkout_started', { product: productId });
}

export function isPaddleConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN);
}
