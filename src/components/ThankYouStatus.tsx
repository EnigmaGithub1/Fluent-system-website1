'use client';
// src/components/ThankYouStatus.tsx
//
// Polls /api/orders/status until the webhook has confirmed fulfillment.
// This is the concrete implementation of "the frontend success page
// may provide immediate UX feedback, but the backend must independently
// verify payment status" (master prompt section 3).

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

type Status = 'waiting' | 'paid' | 'failed' | 'timeout' | 'missing_transaction';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30; // ~60 seconds before we show a "still processing" state

export default function ThankYouStatus() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const productParam = searchParams.get('product');

  const [status, setStatus] = useState<Status>(transactionId ? 'waiting' : 'missing_transaction');
  const [order, setOrder] = useState<{ id: string; productName: string; customerEmail: string; downloadAccessId: string | null } | null>(null);

  useEffect(() => {
    if (!transactionId) return;

    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/status?transaction_id=${encodeURIComponent(transactionId!)}`);
        const data = await res.json();

        if (cancelled) return;

        if (data.status === 'paid') {
          setOrder(data.order);
          setStatus('paid');
          trackEvent('purchase_completed', { product: data.order?.productName });
          return;
        }
        if (data.status === 'failed' || data.status === 'canceled') {
          setStatus('failed');
          return;
        }
        if (attempts >= MAX_POLLS) {
          setStatus('timeout');
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled && attempts < MAX_POLLS) setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [transactionId]);

  if (status === 'missing_transaction') {
    return (
      <StatusShell
        title="We couldn't find that order"
        body="This page is meant to be reached right after checkout. If you just completed a purchase, check your email for your confirmation and access link."
      />
    );
  }

  if (status === 'waiting') {
    return (
      <StatusShell
        title="Confirming your payment…"
        body="This usually takes just a few seconds. Please don't close this page."
        pending
      />
    );
  }

  if (status === 'timeout') {
    return (
      <StatusShell
        title="Still processing"
        body={`This is taking longer than usual. We've sent (or will send) a confirmation email as soon as it's ready — check your inbox, or contact ${process.env.SUPPORT_EMAIL || 'support'} if it's been more than a few minutes.`}
      />
    );
  }

  if (status === 'failed') {
    return (
      <StatusShell
        title="Payment wasn't completed"
        body="It looks like this payment didn't go through. No charge should have been made. You can try again whenever you're ready."
        action={{ href: `/checkout${productParam ? `?product=${productParam}` : ''}`, label: 'Try again' }}
      />
    );
  }

  // status === 'paid'
  return (
    <div>
      <p className="kicker">Thank you</p>
      <h1 className="mt-3 font-serif text-3xl text-ink">Your {order?.productName} purchase is ready.</h1>

      <div className="mt-8 rounded-card border border-line bg-white p-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/50">Product</dt>
            <dd className="text-ink">{order?.productName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/50">Order</dt>
            <dd className="text-ink">{order?.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/50">Email</dt>
            <dd className="text-ink">{order?.customerEmail}</dd>
          </div>
        </dl>

        <a
          href="/download"
          className="btn-primary mt-6 w-full"
          onClick={() => trackEvent('download_started')}
        >
          Access Your Download
        </a>
      </div>

      <p className="mt-5 text-center text-sm text-ink/60">
        We&apos;ve sent a confirmation email with your access link to {order?.customerEmail}.
      </p>
    </div>
  );
}

function StatusShell({
  title,
  body,
  pending,
  action,
}: {
  title: string;
  body: string;
  pending?: boolean;
  action?: { href: string; label: string };
}) {
  return (
    <div className="text-center">
      {pending && (
        <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-2 border-line border-t-rust" aria-hidden />
      )}
      <h1 className="font-serif text-2xl text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink/70">{body}</p>
      {action && (
        <a href={action.href} className="btn-primary mt-6 inline-flex">
          {action.label}
        </a>
      )}
    </div>
  );
}
