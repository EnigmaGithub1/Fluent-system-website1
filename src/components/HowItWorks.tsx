// src/components/HowItWorks.tsx
const STEPS = [
  { n: '01', title: 'Understand', desc: 'Learn the five-part model that everything else builds on.' },
  { n: '02', title: 'Practice', desc: 'Train the skills with exercises, drills, and daily missions.' },
  { n: '03', title: 'Apply', desc: 'Use them in real interactions — that\u2019s where it actually counts.' },
  { n: '04', title: 'Track', desc: 'Reflect, adjust, and repeat with a real record of progress.' },
];

export default function HowItWorks() {
  return (
    <section className="section-pad bg-paper">
      <div className="mx-auto max-w-content">
        <p className="kicker">How it works</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Four steps. No magic.</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n}>
              <p className="font-serif text-3xl text-rust">{s.n}</p>
              <h3 className="mt-2 font-serif text-lg text-ink">{s.title}</h3>
              <p className="mt-1 text-sm text-ink/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
