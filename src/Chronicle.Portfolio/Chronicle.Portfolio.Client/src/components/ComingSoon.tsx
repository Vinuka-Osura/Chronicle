/**
 * Honest placeholder for a page whose backend slice has not shipped yet.
 *
 * It names what is missing and which phase it belongs to rather than showing lorem
 * ipsum, because the site is itself a work sample and a fake page is worse than an
 * absent one.
 */
export function ComingSoon({
  title,
  summary,
  phase,
}: {
  title: string;
  summary: string;
  phase: string;
}) {
  return (
    <section className="max-w-2xl">
      <p className="mb-2 font-mono text-xs tracking-[0.2em] text-signal uppercase">
        {phase}
      </p>
      <h1 className="text-title mb-4 font-semibold">{title}</h1>
      <p className="text-ink-soft">{summary}</p>
    </section>
  );
}
