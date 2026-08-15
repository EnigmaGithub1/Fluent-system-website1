// src/components/Hero.tsx
import CheckoutButton from '@/components/CheckoutButton';

export default function Hero() {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto max-w-content px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <p className="kicker text-[#D8A97F]">A Practical System, Not a Pep Talk</p>
        <h1 className="mt-5 max-w-3xl font-serif text-[2.5rem] leading-[1.05] sm:text-6xl">
          Stop Overthinking Every Conversation.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#E8E1D3] sm:text-xl">
          FLUENT is a practical system for becoming more comfortable speaking, connecting, reading
          social feedback, expressing yourself, and recovering when things don&apos;t go perfectly.
        </p>

        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <CheckoutButton productId="fluent" />
          <a
            href="#whats-inside"
            className="text-sm font-medium text-[#E8E1D3] underline decoration-[#D8A97F]/50 underline-offset-4 hover:text-paper"
          >
            See what&apos;s inside
          </a>
        </div>

        <p className="mt-5 text-xs text-[#9C9384]">
          One-time payment · $24.99 · No subscription · Instant digital access
        </p>
      </div>
    </section>
  );
}
