// src/app/download/page.tsx
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import DownloadLookup from '@/components/DownloadLookup';

export default function DownloadPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-xl px-5 py-16 sm:py-24">
        <p className="kicker">Welcome back</p>
        <h1 className="mt-3 font-serif text-3xl text-ink">Access your purchase</h1>
        <p className="mt-3 text-sm text-ink/70">
          Enter the email you used at checkout and we&apos;ll send a fresh access link — your
          original confirmation email also has one that works any time.
        </p>
        <div className="mt-8">
          <DownloadLookup />
        </div>
      </main>
      <Footer />
    </>
  );
}
