// src/components/Nav.tsx
import Link from 'next/link';

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-content items-center justify-between px-5 py-4 sm:px-8"
      >
        <Link href="/" className="font-serif text-xl tracking-tight text-ink">
          FLUENT
        </Link>
        <div className="hidden items-center gap-8 text-sm sm:flex">
          <a href="#whats-inside" className="text-ink/70 hover:text-ink">
            What&apos;s Inside
          </a>
          <a href="#pricing" className="text-ink/70 hover:text-ink">
            Pricing
          </a>
          <a href="#faq" className="text-ink/70 hover:text-ink">
            FAQ
          </a>
        </div>
        <a
          href="#pricing"
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink/90"
        >
          Get FLUENT
        </a>
      </nav>
    </header>
  );
}
