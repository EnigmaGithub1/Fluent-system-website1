// src/components/WhatsInside.tsx
const ITEMS = [
  { title: 'The Social Fluency Model', desc: 'Presence, Expression, Reciprocity, Calibration, Adaptation — one framework for the rest of the system.' },
  { title: 'Conversation', desc: 'Momentum, disclosure, listening, and how to end well.' },
  { title: 'Reciprocity', desc: 'Reading real engagement without mind-reading.' },
  { title: 'Calibration', desc: 'The same behavior, read differently depending on the room.' },
  { title: 'Warmth', desc: 'Making an interaction feel good, not just avoiding awkwardness.' },
  { title: 'Self-Expression', desc: 'Preferences, opinions, boundaries — said plainly.' },
  { title: 'Recovery', desc: 'What to actually do when it gets awkward.' },
  { title: 'Assertiveness', desc: 'Disagreeing without shrinking or attacking.' },
  { title: 'Rejection', desc: 'Telling "bad fit" apart from "bad you."' },
  { title: '30-Day Training', desc: 'A graduated, real-world practice program.' },
];

export default function WhatsInside() {
  return (
    <section id="whats-inside" className="section-pad bg-paper">
      <div className="mx-auto max-w-content">
        <p className="kicker">What&apos;s inside</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Everything you need to actually practice.</h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <div key={item.title} className="rounded-card border border-line bg-white p-5">
              <h3 className="font-serif text-lg text-rust-dark">{item.title}</h3>
              <p className="mt-2 text-sm text-ink/75">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
