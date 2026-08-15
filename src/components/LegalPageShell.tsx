// src/components/LegalPageShell.tsx
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
        <p className="kicker">Legal</p>
        <h1 className="mt-3 font-serif text-3xl text-ink">{title}</h1>
        <p className="mt-2 text-xs text-ink/50">Last updated: {updated}</p>

        <div className="mt-6 rounded-card border border-line bg-soft p-4 text-xs text-ink/70">
          <strong>Template notice:</strong> this page is a starting-point template, not finished legal
          copy. Review it with a lawyer familiar with your jurisdiction and Paddle&apos;s Merchant-of-
          Record model before relying on it in production.
        </div>

        <div className="prose prose-sm mt-8 max-w-none text-ink/80 [&_h2]:font-serif [&_h2]:text-ink [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
