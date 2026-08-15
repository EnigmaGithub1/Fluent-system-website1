// src/components/ModelSection.tsx
const MODEL = [
  { name: 'Presence', desc: 'Being actually in the interaction, not narrating it from the sidelines.' },
  { name: 'Expression', desc: 'Putting an honest thought into words instead of holding it back.' },
  { name: 'Reciprocity', desc: 'Noticing whether the exchange is actually mutual.' },
  { name: 'Calibration', desc: 'Matching your behavior to the actual room you\u2019re in.' },
  { name: 'Adaptation', desc: 'Adjusting in real time as you learn what\u2019s happening.' },
];

export default function ModelSection() {
  return (
    <section className="section-pad bg-ink text-paper">
      <div className="mx-auto max-w-content">
        <p className="kicker text-[#D8A97F]">The core model</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl">The Social Fluency Model</h2>
        <p className="mt-4 max-w-xl text-[#C8BEA9]">
          Five capacities, not one trick. Everything in FLUENT builds toward these.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {MODEL.map((m, i) => (
            <div key={m.name} className="flex-1 min-w-[220px] rounded-card border border-white/15 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-[#D8A97F]">
                <span className="font-serif text-sm">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-serif text-lg text-paper">{m.name}</h3>
              </div>
              <p className="mt-2 text-sm text-[#C8BEA9]">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
