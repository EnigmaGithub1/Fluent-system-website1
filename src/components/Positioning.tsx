// src/components/Positioning.tsx
const NOT_LIST = [
  'Pickup lines',
  'Manipulation tactics',
  '"Alpha male" scripts',
  'Canned conversation lines',
  'Fake confidence',
  'Pretending to be someone else',
];
const IS_LIST = ['Social awareness', 'Self-expression', 'Reciprocity', 'Calibration', 'Adaptation', 'Real-world practice'];

export default function Positioning() {
  return (
    <section className="section-pad bg-soft">
      <div className="mx-auto max-w-content">
        <p className="kicker">What this actually is</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Not a script. A skill.</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-6">
            <h3 className="font-serif text-lg text-rust-dark">FLUENT is not</h3>
            <ul className="mt-4 space-y-2.5">
              {NOT_LIST.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink/75">
                  <span aria-hidden>✕</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-line bg-ink p-6 text-paper">
            <h3 className="font-serif text-lg text-[#D8A97F]">FLUENT is</h3>
            <ul className="mt-4 space-y-2.5">
              {IS_LIST.map((i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[#E8E1D3]">
                  <span aria-hidden>✓</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
