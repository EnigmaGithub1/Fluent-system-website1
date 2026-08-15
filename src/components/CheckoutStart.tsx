'use client';
// src/components/CheckoutStart.tsx
import { useState } from 'react';
import { createCheckout, isPaddleConfigured } from '@/lib/paddle/client';
import { getProduct, isProductConfigured, type InternalProductId } from '@/lib/products';

export default function CheckoutStart({ productId }: { productId: InternalProductId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const product = getProduct(productId);
  const configured = isPaddleConfigured() && isProductConfigured(productId);

  async function open() {
    setError(null);
    if (!configured) {
      setError(
        'Paddle checkout is not connected yet in this environment. See PADDLE_SETUP.md — this page ' +
          'renders correctly, but opening real checkout requires a client token and price ID.'
      );
      return;
    }
    setLoading(true);
    try {
      await createCheckout({ productId });
    } catch (err) {
      console.error(err);
      setError('Checkout could not open. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="btn-primary w-full disabled:opacity-70 disabled:cursor-wait"
        aria-busy={loading}
      >
        {loading ? 'Opening secure checkout…' : `Continue to Payment — ${product.displayPrice}`}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-xs text-rust-dark">
          {error}
        </p>
      )}
    </div>
  );
}
