'use client';

import { useState } from 'react';
import { createCheckout, isPaddleConfigured } from '@/lib/paddle/client';
import { getProduct, type InternalProductId, isProductConfigured } from '@/lib/products';
import { trackEvent } from '@/lib/analytics';

interface CheckoutButtonProps {
  productId: InternalProductId;
  variant?: 'primary' | 'secondary';
  className?: string;
  children?: React.ReactNode;
}

export default function CheckoutButton({ productId, variant = 'primary', className = '', children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const product = getProduct(productId);
  const configured = isPaddleConfigured() && isProductConfigured(productId);

  async function handleClick() {
    setError(null);

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!configured) {
      setError(
        `Checkout isn't connected yet — ${!isPaddleConfigured() ? 'Paddle client token' : 'this price ID'} is missing from configuration.`
      );
      return;
    }

    setLoading(true);
    trackEvent('product_view', { product: productId });
    try {
      await createCheckout({ 
        productId, 
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
    } catch (err) {
      console.error(err);
      setError('Checkout could not open. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-ink/20 rounded"
        disabled={loading}
      />
      <input
        type="text"
        placeholder="First name (optional)"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-ink/20 rounded"
        disabled={loading}
      />
      <input
        type="text"
        placeholder="Last name (optional)"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full sm:w-auto px-4 py-2 border border-ink/20 rounded"
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className={`${base} ${className} disabled:opacity-70 disabled:cursor-wait w-full sm:w-auto`}
      >
        {loading ? 'Opening checkout…' : children || `Get ${product.name} — ${product.displayPrice}`}
      </button>
      {error && (
        <p role="alert" className="text-xs text-rust-dark max-w-xs text-center">
          {error}
        </p>
      )}
      {!configured && process.env.NODE_ENV === 'development' && (
        <p className="text-[11px] text-ink/40 max-w-xs text-center">
          Dev note: Paddle isn&apos;t configured yet — see PADDLE_SETUP.md.
        </p>
      )}
    </div>
  );
}
