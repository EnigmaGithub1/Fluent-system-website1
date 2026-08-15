// src/lib/paddle/webhook.ts
//
// Paddle webhook signature verification.
//
// Verified against current Paddle documentation (developer.paddle.com/
// webhooks/about/signature-verification, Aug 2026):
//
//   1. Every webhook request includes a `Paddle-Signature` header
//      formatted as:  ts=<unix_timestamp>;h1=<hex_hmac_sha256>
//   2. The signed material is the STRING  `${ts}:${rawRequestBody}`
//      — not the body alone. Missing the "ts:" prefix is the most
//      common cause of "valid code, invalid signature" bugs.
//   3. The HMAC is computed with SHA-256 using your webhook
//      destination's secret key (Dashboard > Developer Tools >
//      Notifications > your destination > "Secret key").
//   4. You MUST verify against the exact raw bytes Paddle sent —
//      Next.js route handlers give you this via `await req.text()`,
//      which must happen BEFORE any JSON.parse().
//
// This file implements verification manually with Node's built-in
// `crypto` module so the project has zero extra dependency risk.
// Paddle also publishes an official SDK (@paddle/paddle-node-sdk)
// with a `paddle.webhooks.unmarshal()` helper that does the same
// thing plus response typing — swap to that if you'd rather depend
// on Paddle's maintained SDK. Both approaches are documented in
// PADDLE_SETUP.md.

import { createHmac, timingSafeEqual } from 'crypto';

const SIGNATURE_HEADER = 'paddle-signature';
// Reject webhooks whose timestamp is older than this — mitigates replay
// of a captured request. Paddle typically delivers within seconds.
const MAX_TIMESTAMP_DRIFT_SECONDS = 5 * 60;

export class WebhookVerificationError extends Error {}

interface ParsedSignatureHeader {
  timestamp: string;
  hash: string;
}

function parseSignatureHeader(header: string): ParsedSignatureHeader {
  // Format: "ts=1717000000;h1=eb4d0a2f...<64 hex chars>"
  const parts = Object.fromEntries(
    header.split(';').map((pair) => {
      const [key, value] = pair.split('=');
      return [key?.trim(), value?.trim()];
    })
  );

  if (!parts.ts || !parts.h1) {
    throw new WebhookVerificationError('Malformed Paddle-Signature header.');
  }

  return { timestamp: parts.ts, hash: parts.h1 };
}

/**
 * Verifies a Paddle webhook request and returns the parsed JSON body
 * if — and only if — the signature is valid.
 *
 * @param rawBody   The EXACT raw request body string (not re-serialized JSON).
 * @param signatureHeader  The value of the `Paddle-Signature` request header.
 * @param secret    Your notification destination's secret key (PADDLE_WEBHOOK_SECRET).
 */
export function verifyPaddleWebhook<T = unknown>(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): T {
  if (!secret) {
    throw new WebhookVerificationError(
      'PADDLE_WEBHOOK_SECRET is not configured. Refusing to process an unverifiable webhook.'
    );
  }
  if (!signatureHeader) {
    throw new WebhookVerificationError(`Missing ${SIGNATURE_HEADER} header.`);
  }

  const { timestamp, hash } = parseSignatureHeader(signatureHeader);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(nowSeconds - tsSeconds) > MAX_TIMESTAMP_DRIFT_SECONDS) {
    throw new WebhookVerificationError('Webhook timestamp is outside the allowed drift window (possible replay).');
  }

  const signedPayload = `${timestamp}:${rawBody}`;
  const expectedHex = createHmac('sha256', secret).update(signedPayload).digest('hex');

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(hash, 'hex');

  // Constant-time comparison — never use === on signatures.
  const isValid =
    expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!isValid) {
    throw new WebhookVerificationError('Signature mismatch.');
  }

  return JSON.parse(rawBody) as T;
}

export { SIGNATURE_HEADER };

// ------------------------------------------------------------
// Event payload shapes we actually handle.
// One-time-purchase products only use the `transaction.*` family —
// subscription events (subscription.created, etc.) are not relevant
// to FLUENT / FLUENT COMPLETE and are intentionally ignored.
// ------------------------------------------------------------

export interface PaddleWebhookEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: PaddleTransactionEventData;
}

export interface PaddleTransactionEventData {
  id: string; // transaction id, e.g. txn_...
  status: string; // "completed" | "paid" | "canceled" | ...
  customer_id: string | null;
  customer?: { id: string; email: string } | null;
  currency_code: string;
  items: Array<{
    price: { id: string };
    quantity: number;
    totals?: { total: string };
  }>;
  details?: {
    totals?: { total: string; currency_code: string };
  };
  custom_data?: { internal_product_id?: string } | null;
  billed_at?: string | null;
  customer_details?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

/** Event types this integration listens for. See PADDLE_SETUP.md for
 *  exactly which events to enable on the notification destination. */
export const HANDLED_EVENT_TYPES = ['transaction.completed', 'transaction.paid'] as const;
