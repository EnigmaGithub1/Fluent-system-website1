// src/app/thank-you/page.tsx
import { Suspense } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ThankYouStatus from '@/components/ThankYouStatus';

export default function ThankYouPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        {/* useSearchParams() in ThankYouStatus requires a Suspense boundary
            per Next.js App Router — see nextjs.org/docs/messages/missing-suspense-with-csr-bailout */}
        <Suspense fallback={<div className="text-center text-sm text-ink/50">Loading…</div>}>
          <ThankYouStatus />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
