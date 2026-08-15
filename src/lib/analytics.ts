// src/lib/analytics.ts
//
// Analytics abstraction (master prompt section 44). Components call
// trackEvent() with one of the event names below; this file fans the
// call out to whichever providers are configured via env vars. No
// provider is required for the site to function.
//
// Deliberately NOT invasive: no fingerprinting, no cross-site tracking
// beyond the standard pixels a merchant explicitly opts into by setting
// their IDs. Respects window.location only; no extra PII is attached.
'use client';

export type AnalyticsEvent =
  | 'landing_page_view'
  | 'product_view'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_completed_client'
  | 'checkout_error'
  | 'complete_upsell_viewed'
  | 'complete_upsell_clicked'
  | 'purchase_completed'
  | 'download_started'
  | 'download_completed';

type EventPayload = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, payload?: Record<string, unknown>) => void };
  }
}

export function trackEvent(event: AnalyticsEvent, payload: EventPayload = {}) {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, payload);
  }

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', event, payload);
  }

  // Meta Pixel — maps our event names to the closest standard Meta event
  // where one exists; falls back to a custom event otherwise.
  if (window.fbq) {
    const metaEventMap: Partial<Record<AnalyticsEvent, string>> = {
      checkout_started: 'InitiateCheckout',
      purchase_completed: 'Purchase',
      product_view: 'ViewContent',
    };
    const mapped = metaEventMap[event];
    if (mapped) {
      window.fbq('track', mapped, payload);
    } else {
      window.fbq('trackCustom', event, payload);
    }
  }

  // TikTok Pixel
  if (window.ttq) {
    const tiktokEventMap: Partial<Record<AnalyticsEvent, string>> = {
      checkout_started: 'InitiateCheckout',
      purchase_completed: 'CompletePayment',
      product_view: 'ViewContent',
    };
    window.ttq.track(tiktokEventMap[event] || event, payload);
  }
}
