'use client';
// src/components/CompleteUpsell.tsx
import { useEffect, useRef } from 'react';
import CheckoutButton from '@/components/CheckoutButton';
import { trackEvent } from '@/lib/analytics';

const FLUENT_FEATURES = ['Core system', 'Main FLUENT book (PDF)', 'The five-part framework', 'Context playbook'];
const COMPLETE_FEATURES = [
  'Everything in FLUENT',
  'Full workbook (24 exercises)',
  'Social Fluency Diagnostic',
  'Failure-mode assessment',
  '30-Day training system + tracker',
  'Daily practice cards',
  '60 scenario drills + advanced set',
  'Interaction journal & weekly reviews',
  'Quick-reference toolkit',
];

export default function CompleteUpsell() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent('complete_upsell_viewed');
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={ref} className="section-pad bg-soft">
      <div className="mx-auto max-w-content">
        <p className="kicker">Want more than the system?</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Get the tools to actually train it.</h2>
        <p className="mt-4 max-w-xl text-ink/75">
          FLUENT teaches you the model. FLUENT COMPLETE adds the diagnostic, the 30-day program, scenario
          training, and the tracking tools to prove to yourself it&apos;s working.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-7">
            <h3 className="font-serif text-2xl text-ink">FLUENT</h3>
            <p className="mt-1 text-sm text-ink/60">Learn the system.</p>
            <p className="mt-4 font-serif text-4xl text-ink">$24.99</p>
            <p className="text-xs text-ink/50">one-time payment</p>
            <ul className="mt-6 space-y-2.5">
              {FLUENT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink/80">
                  <span className="text-sage" aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <CheckoutButton productId="fluent" variant="secondary" className="w-full" />
            </div>
          </div>

          <div className="rounded-card border-2 border-rust bg-ink p-7 text-paper relative">
            <span className="absolute -top-3 left-6 rounded-full bg-rust px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-paper">
              Most complete
            </span>
            <h3 className="font-serif text-2xl">FLUENT COMPLETE</h3>
            <p className="mt-1 text-sm text-[#C8BEA9]">Learn it. Practice it. Track it. Apply it.</p>
            <p className="mt-4 font-serif text-4xl">$39.99</p>
            <p className="text-xs text-[#9C9384]">one-time payment · get Complete for $15 more</p>
            <ul className="mt-6 space-y-2.5">
              {COMPLETE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#E8E1D3]">
                  <span className="text-[#D8A97F]" aria-hidden>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <div onClick={() => trackEvent('complete_upsell_clicked')}>
                <CheckoutButton productId="fluent_complete" variant="primary" className="w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
