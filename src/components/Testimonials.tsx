// src/components/Testimonials.tsx
//
// Master prompt section 20: do not fabricate testimonials, names,
// photos, ratings, or customer counts. This component is a real,
// ready-to-populate placeholder — remove the empty state and add real
// entries to TESTIMONIALS once you have them.

interface Testimonial {
  quote: string;
  name: string;
  detail?: string;
}

// Intentionally empty. Populate with real, permission-cleared
// testimonials before launch — see README.md "Adding testimonials".
const TESTIMONIALS: Testimonial[] = [];

export default function Testimonials() {
  if (TESTIMONIALS.length === 0) {
    // Renders nothing on the live site rather than a fake "coming soon"
    // placeholder that could read as manufactured social proof.
    return null;
  }

  return (
    <section className="section-pad bg-paper">
      <div className="mx-auto max-w-content">
        <p className="kicker">What people are saying</p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote key={t.name} className="rounded-card border border-line bg-white p-6">
              <p className="text-sm text-ink/85">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 text-xs text-ink/50">
                — {t.name}
                {t.detail ? `, ${t.detail}` : ''}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
