// src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-serif text-lg text-ink">FLUENT</p>
            <p className="mt-2 max-w-sm text-sm text-ink/60">
              You don&apos;t need to become someone else to become socially confident. You need to
              become comfortable enough to participate.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:flex sm:gap-12">
            <div>
              <p className="font-semibold text-ink/80">Product</p>
              <ul className="mt-3 space-y-2 text-ink/60">
                <li><a href="/#whats-inside" className="hover:text-ink">What&apos;s inside</a></li>
                <li><a href="/#pricing" className="hover:text-ink">Pricing</a></li>
                <li><a href="/#faq" className="hover:text-ink">FAQ</a></li>
                <li><Link href="/download" className="hover:text-ink">Access my download</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-ink/80">Legal</p>
              <ul className="mt-3 space-y-2 text-ink/60">
                <li><Link href="/legal/privacy" className="hover:text-ink">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-ink">Terms of Service</Link></li>
                <li><Link href="/legal/refund" className="hover:text-ink">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-ink/40">
          © {new Date().getFullYear()} FLUENT. Payments processed securely by Paddle.com, our
          Merchant of Record.
        </p>
      </div>
    </footer>
  );
}
