// src/components/WhoItsFor.tsx
const FOR = [
  'You overthink conversations',
  'You want to become more socially capable',
  'You struggle to express yourself',
  'You want to understand reciprocity',
  'You want practical exercises, not just theory',
  'You want to stop replaying every interaction',
];
const NOT_FOR = [
  'You want manipulation tactics',
  'You expect guaranteed romantic success',
  'You want magic conversation scripts',
  "You don't intend to actually practice",
];

export default function WhoItsFor() {
  return (
    <section className="section-pad bg-soft">
      <div className="mx-auto max-w-content">
        <p className="kicker">Is this for you?</p>
        <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Read both lists honestly.</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-6">
            <h3 className="font-serif text-lg text-sage">FLUENT is for you if</h3>
            <ul className="mt-4 space-y-2.5">
              {FOR.map((i) => (
                <li key={i} className="text-sm text-ink/80">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-line bg-white p-6">
            <h3 className="font-serif text-lg text-rust-dark">FLUENT may not be for you if</h3>
            <ul className="mt-4 space-y-2.5">
              {NOT_FOR.map((i) => (
                <li key={i} className="text-sm text-ink/80">
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
