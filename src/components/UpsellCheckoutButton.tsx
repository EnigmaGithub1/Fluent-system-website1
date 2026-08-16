'use client';

import { useState } from 'react';
import CheckoutButton from '@/components/CheckoutButton';
import type { InternalProductId } from '@/lib/products';
import { getProduct } from '@/lib/products';

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
  const [selectedProduct, setSelectedProduct] = useState<InternalProductId>(productId);
  const product = getProduct(productId);
  const upsellProduct = getProduct(upsellTo);

  const handleClick = () => {
    setShowUpsell(true);
    setSelectedProduct(productId);
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
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-paper rounded-lg shadow-lg p-8 max-w-md z-50">
          <h2 className="text-2xl font-serif text-ink mb-4">
            Wait! Consider FLUENT COMPLETE
          </h2>

          <p className="text-ink/80 mb-6">
            FLUENT COMPLETE includes everything in FLUENT plus advanced training methods and personalized scenarios.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
            <p className="text-sm text-ink/70">
              <span className="font-semibold">FLUENT:</span> ${getProduct('fluent').displayPrice}
            </p>
            <p className="text-sm text-ink/70 mt-2">
              <span className="font-semibold">FLUENT COMPLETE:</span> ${upsellProduct.displayPrice}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSelectedProduct(upsellTo);
                setShowUpsell(false);
              }}
              className="btn-primary w-full"
            >
              Get FLUENT COMPLETE instead
            </button>

            <button
              onClick={() => {
                setSelectedProduct(productId);
                setShowUpsell(false);
              }}
              className="btn-secondary w-full"
            >
              Proceed with {product.name}
            </button>

            <button
              onClick={() => setShowUpsell(false)}
              className="text-sm text-ink/60 hover:text-ink/80 py-2"
            >
              Close
            </button>
          </div>
        </div>

        {/* Hidden checkout button that triggers based on selection */}
        <div className="hidden">
          <CheckoutButton productId={selectedProduct} />
        </div>

        {/* Visible button that opens checkout when selection is made */}
        {selectedProduct && selectedProduct !== productId && (
          <CheckoutButton productId={selectedProduct} />
        )}
        {selectedProduct === productId && (
          <CheckoutButton productId={productId} />
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`btn-${variant} ${className}`}
    >
      {children || `Get ${product.name} — ${product.displayPrice}`}
    </button>
  );
}
