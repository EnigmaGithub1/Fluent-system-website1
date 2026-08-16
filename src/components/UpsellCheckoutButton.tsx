'use client';

import { useState } from 'react';
import { createCheckout, isPaddleConfigured } from '@/lib/paddle/client';
import type { InternalProductId } from '@/lib/products';
import { getProduct, isProductConfigured } from '@/lib/products';
import { trackEvent } from '@/lib/analytics';

interface UpsellCheckoutButtonProps {
  productId: InternalProductId;
  variant?: 'primary' | 'secondary';
  className?: string;
  children?: React.ReactNode;
  upsellTo?: InternalProductId;
}

export default function UpsellCheckoutButton({
  productId,
  variant = 'primary',
  className = '',
  children,
  upsellTo = 'fluent_complete',
}: UpsellCheckoutButtonProps) {
  const [showUpsell, setShowUpsell] = useState(false);
  const [loading, setLoading] = useState(false);
  const product = getProduct(productId);
  const upsellProduct = getProduct(upsellTo);
  const configured = isPaddleConfigured() && isProductConfigured(productId);

  const handleProceed = async (selectedProductId: InternalProductId) => {
    setLoading(true);
    trackEvent('product_view', { product: selectedProductId });
    try {
      await createCheckout({ productId: selectedProductId });
    } catch (err) {
      console.error(err);
      alert('Checkout could not open. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMainClick = () => {
    if (!configured) {
      alert(
        `Checkout isn't connected yet — ${!isPaddleConfigured() ? 'Paddle client token' : 'this price ID'} is missing.`
      );
      return;
    }
    setShowUpsell(true);
  };

  if (showUpsell) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowUpsell(false)}
        />

        {/* Modal */}
        <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md bg-paper rounded-lg shadow-xl p-6 sm:p-8 z-50 flex flex-col max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowUpsell(false)}
            className="absolute top-4 right-4 text-ink/50 hover:text-ink text-xl"
          >
            ✕
          </button>

          <h2 className="text-xl sm:text-2xl font-serif text-ink mb-3 pr-6">
            Upgrade to FLUENT COMPLETE?
          </h2>

          <p className="text-sm sm:text-base text-ink/80 mb-4">
            ✓Everything in FLUENT
            ✓Full workbook (24 exercises)
            ✓Social Fluency Diagnostic
            ✓Failure-mode assessment
            ✓30-Day training system + tracker
            and much more
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-ink">FLUENT</span>
              <span className="text-sm text-ink/70">{getProduct('fluent').displayPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-ink">FLUENT COMPLETE</span>
              <span className="text-sm text-ink/70">{upsellProduct.displayPrice}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={() => handleProceed(upsellTo)}
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-70"
            >
              {loading ? 'Opening checkout...' : 'Get FLUENT COMPLETE'}
            </button>

            <button
              onClick={() => handleProceed(productId)}
              disabled={loading}
              className="btn-secondary w-full py-3 disabled:opacity-70"
            >
              {loading ? 'Opening checkout...' : `Proceed with ${product.name}`}
            </button>

            <button
              onClick={() => setShowUpsell(false)}
              className="text-xs sm:text-sm text-ink/50 hover:text-ink/70 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

  return (
    <button
      onClick={handleMainClick}
      className={`${base} ${className}`}
    >
      {children || `Get ${product.name} — ${product.displayPrice}`}
    </button>
  );
}
