// src/components/ProblemSection.tsx
const PROBLEMS = [
  'Thinking of the perfect response five minutes too late',
  'Replaying conversations, looking for the mistake',
  'Not knowing whether to keep going or let it end',
  'Worrying about being judged before you even speak',
  'Struggling to actually start a conversation',
  'Conversations that feel forced instead of easy',
  "Knowing social advice intellectually but not being able to use it",
];

export default function ProblemSection() {
  return (
    <section className="section-pad bg-paper">
      <div className="mx-auto max-w-content">
        <p className="kicker">If any of this sounds familiar</p>
        <h2 className="mt-3 max-w-2xl font-serif text-3xl text-ink sm:text-4xl">
          You already know the feeling.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-card border border-line bg-white p-4">
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rust" aria-hidden />
              <p className="text-sm text-ink/85 sm:text-base">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
