'use client';
// src/components/DownloadLookup.tsx
//
// Master prompt section 31: the /download page shows exactly what a
// customer owns. Since we don't have a login/session system (deliberately
// out of scope — this is a one-time-purchase digital product, not an
// account-based SaaS), access is recovered via emailed link instead:
// enter your purchase email, get a fresh signed download link sent to it.

import { useState } from 'react';

export default function DownloadLookup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/access-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-card border border-line bg-white p-6 text-center">
        <p className="text-sm text-ink/80">
          If <strong>{email}</strong> has a purchase on file, we&apos;ve sent a fresh access link to
          it. Check your inbox (and spam folder) in the next couple of minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-line bg-white p-6">
      <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-ink/60">
        Email address
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-2 w-full rounded-md border border-line px-4 py-3 text-sm focus:border-rust focus:outline-none"
      />
      <button type="submit" disabled={status === 'loading'} className="btn-primary mt-4 w-full disabled:opacity-70">
        {status === 'loading' ? 'Sending…' : 'Send my access link'}
      </button>
      {status === 'error' && (
        <p role="alert" className="mt-3 text-xs text-rust-dark">
          Something went wrong on our end — please try again in a moment.
        </p>
      )}
    </form>
  );
}
