// src/app/checkout/page.tsx
//
// Master prompt section 23: a polished transition page that shows the
// selected product/price clearly, then hands off to Paddle's own
// checkout UI. This page does NOT build a custom payment form — Paddle
// Checkout (an overlay, launched client-side) handles all actual
// payment collection.

import Link from 'next/link';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CheckoutStart from '@/components/CheckoutStart';
import { PRODUCTS, type InternalProductId } from '@/lib/products';

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: { product?: string };
}) {
  const requested = searchParams.product as InternalProductId | undefined;
  const productId: InternalProductId = requested && requested in PRODUCTS ? requested : 'fluent';
  const product = PRODUCTS[productId];

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <p className="kicker">Checkout</p>
        <h1 className="mt-3 font-serif text-3xl text-ink">You&apos;re getting {product.name}</h1>

        <div className="mt-8 rounded-card border border-line bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-xl text-ink">{product.name}</p>
              <p className="mt-1 text-sm text-ink/60">{product.tagline}</p>
            </div>
            <div className="text-right">
              <p className="font-serif text-2xl text-ink">{product.displayPrice}</p>
              <p className="text-xs text-ink/50">USD · one-time</p>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5 text-sm text-ink/70">
            <p>
              Your email is required because we&apos;ll send your purchase confirmation and permanent
              access link there.
            </p>
          </div>

          <div className="mt-6">
            <CheckoutStart productId={productId} />
          </div>

          <p className="mt-4 text-center text-xs text-ink/45">
            Payment is securely processed by Paddle.com. We never see or store your card details.
          </p>
        </div>

        {productId === 'fluent' && (
          <p className="mt-6 text-center text-sm text-ink/60">
            Want the full training system instead?{' '}
            <Link href="/checkout?product=fluent_complete" className="font-medium text-rust underline underline-offset-4">
              Switch to FLUENT COMPLETE — $39.99
            </Link>
          </p>
        )}

        <div className="mt-10 rounded-card border border-line bg-soft p-5 text-xs text-ink/60">
          <p className="font-semibold text-ink/80">Trust &amp; support</p>
          <p className="mt-1">
            One-time payment, no subscription. Instant digital access, plus a permanent link emailed
            to you. Questions before you buy? Contact {process.env.SUPPORT_EMAIL || 'support@yourdomain.com'}.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
