import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Software City",
  description:
    "A career-visualisation engine: drag a timeline and a city rebuilds itself, skills as buildings and projects as roads. A separate product, driven by the open career-graph contract this site already publishes.",
};

export default function SoftwareCityPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-10">
        <p className="mb-2 font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
          In development &middot; separate product
        </p>
        <h1 className="text-title font-semibold">Software City</h1>
        <p className="text-lede mt-4 text-ink-soft">
          A career-visualisation engine. Drag a timeline and a city rebuilds itself —
          skills as buildings that gain storeys, projects as roads connecting the
          districts they touched, plans as blueprints that never pretend to be finished.
        </p>
      </header>

      <section data-rise="1" className="mb-10">
        <h2 className="text-section mb-3 font-semibold">Why it is not part of this site</h2>
        <p className="mb-3 text-ink-soft">
          Because it is not about me. The engine reads timestamped data and works out what
          exists at a given date; it has never heard of my career specifically. That is
          what makes it a product rather than a page — and a product with its own lifecycle
          does not belong inside somebody&rsquo;s portfolio repository.
        </p>
        <p className="text-ink-soft">
          My career is simply the first dataset it renders, because it is the one I can
          vouch for completely.
        </p>
      </section>

      {/*
        The substance of the teaser. Rather than describing the contract, show it: the
        person who reads this page is the sort who would rather see the interface than a
        paragraph about the interface.
      */}
      <section data-rise="2" className="mb-10">
        <h2 className="text-section mb-3 font-semibold">The seam already exists</h2>
        <p className="mb-4 text-ink-soft">
          This site publishes a versioned, public-domain contract, and the city consumes
          it. Anything that can produce this shape can drive the same renderer — which is
          the entire reason for writing it down rather than wiring the two together.
        </p>

        <div className="surface overflow-x-auto p-4">
          <pre className="font-mono text-xs text-ink-soft">
            <code>{`GET /api/career-graph

{
  "version": 1,
  "subject": { "name": "…" },
  "entities": [
    {
      "id": "skill:…",
      "kind": "building",
      "label": "PostgreSQL",
      "district": "district:Database",
      "built": "2022-09-01",
      "upgraded": ["2023-08-01", "2024-02-01"],
      "magnitude": 0.75,
      "speculative": false
    }
  ]
}`}</code>
          </pre>
        </div>

        <p className="mt-3 text-sm text-ink-faint">
          Schema: <code>contracts/career-graph.v1.schema.json</code>, released under CC0.
          A contract nobody is permitted to implement is not a contract.
        </p>
      </section>

      <section data-rise="3">
        <h2 className="text-section mb-3 font-semibold">What it will show</h2>
        <dl className="rm-grid grid gap-3 sm:grid-cols-2">
          {[
            {
              term: "Buildings are capabilities",
              detail:
                "A skill gains storeys each time it is used again — never demolished and rebuilt, because that is not what learning something more deeply feels like.",
            },
            {
              term: "Roads are work",
              detail:
                "A project physically connects the districts it touched, so how the pieces fitted together is visible rather than listed.",
            },
            {
              term: "Time animates",
              detail:
                "Dragging from 2024 to 2030 plays the construction rather than cutting to the result. The city remembers how it was built.",
            },
            {
              term: "Blueprints stay blueprints",
              detail:
                "Anything past today is drawn unmistakably as intention, so the city can be ambitious without being dishonest.",
            },
          ].map((item) => (
            <div key={item.term} className="surface p-4">
              <dt className="mb-1 font-display font-semibold text-ink">{item.term}</dt>
              <dd className="text-sm text-ink-soft">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
