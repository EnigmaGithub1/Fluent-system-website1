// src/components/FAQ.tsx
const FAQS = [
  { q: 'Is FLUENT a course?', a: 'No. It\u2019s a downloadable system — a PDF guide (and, with Complete, a full set of practice tools) you work through and use at your own pace. There are no scheduled sessions.' },
  { q: 'Is it about dating?', a: 'It covers dating as one context among several — friendships, work, groups, strangers — but the core skills are general social fluency, not a dating-specific system.' },
  { q: 'Do I need to be socially anxious to benefit?', a: 'No. It\u2019s built for anyone who wants to get more comfortable and capable in conversation, whether that\u2019s occasional overthinking or something more persistent.' },
  { q: 'Is this therapy?', a: 'No. FLUENT is educational and behavioral, not a clinical or therapeutic service. If you\u2019re dealing with significant distress, a licensed professional is a better fit alongside (or instead of) this.' },
  { q: 'How long does it take?', a: 'The core book is a focused read. FLUENT COMPLETE\u2019s 30-Day Challenge is, as the name suggests, roughly a month at 10\u201320 minutes a day.' },
  { q: 'Is it downloadable?', a: 'Yes — everything is delivered as PDF (and a ZIP for the Complete bundle) immediately after purchase, plus a permanent access link by email.' },
  { q: 'Do I get lifetime access?', a: 'Yes. Your purchase includes permanent access to your download via the link emailed to you and the /download page.' },
  { q: 'What\u2019s the difference between FLUENT and FLUENT COMPLETE?', a: 'FLUENT teaches the system. FLUENT COMPLETE adds the workbook, diagnostic, 30-day training program, scenario drills, and tracking tools to actually practice and measure it.' },
  { q: 'Is this a subscription?', a: 'No. Both FLUENT and FLUENT COMPLETE are one-time payments. There is no recurring charge.' },
];

export default function FAQ() {
  return (
    <section id="faq" className="section-pad bg-soft">
      <div className="mx-auto max-w-content">
        <p className="kicker">Questions</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">FAQ</h2>
        <div className="mt-10 divide-y divide-line rounded-card border border-line bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group p-5 open:bg-soft/40 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-base text-ink sm:text-lg">
                {item.q}
                <span className="flex-shrink-0 text-rust transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/75 sm:text-base">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
