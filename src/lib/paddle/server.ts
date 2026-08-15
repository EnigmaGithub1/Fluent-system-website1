// src/lib/paddle/server.ts
//
// Server-side Paddle API client. Used sparingly — the webhook is the
// primary source of truth for fulfillment (see webhook.ts), but this
// client lets us independently re-check a transaction's status
// server-to-server if we ever need to (e.g. a manual reconciliation
// job, or double-checking a suspicious event).
//
// Verified base URLs (developer docs / OpenAPI spec, Aug 2026):
//   Production: https://api.paddle.com
//   Sandbox:    https://sandbox-api.paddle.com
// Auth: `Authorization: Bearer <API key>` from Paddle Dashboard >
// Developer Tools > Authentication > API keys.
//
// PADDLE_API_KEY is a server secret. It must never be sent to the
// browser or referenced from a NEXT_PUBLIC_ variable.

const PADDLE_ENV = process.env.PADDLE_ENV === 'production' ? 'production' : 'sandbox';

const BASE_URL =
  PADDLE_ENV === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';

function requireApiKey(): string {
  const key = process.env.PADDLE_API_KEY;
  if (!key) {
    throw new Error(
      'PADDLE_API_KEY is not set. This is required for server-to-server Paddle API calls ' +
        '(not required for basic webhook fulfillment, only for optional reconciliation calls). ' +
        'See PADDLE_SETUP.md.'
    );
  }
  return key;
}

async function paddleFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireApiKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Paddle API error ${res.status} on ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface PaddleTransaction {
  id: string;
  status: string; // e.g. "completed", "paid", "canceled", "past_due"
  customer_id: string | null;
  currency_code: string;
  items: Array<{ price: { id: string }; quantity: number }>;
  details?: { totals?: { total: string; currency_code: string } };
  custom_data?: Record<string, unknown> | null;
}

/**
 * Fetch a transaction directly from Paddle. Useful as a defense-in-depth
 * check — e.g. re-verifying a transaction referenced by a webhook event
 * before granting access, or for a manual admin "resync" action.
 */
export async function getTransaction(transactionId: string): Promise<PaddleTransaction> {
  const data = await paddleFetch<{ data: PaddleTransaction }>(`/transactions/${transactionId}`);
  return data.data;
}

export function getPaddleEnvironment() {
  return PADDLE_ENV;
}
