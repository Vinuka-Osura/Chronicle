import type { Certification } from "@/lib/types";

function issued(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Credentials, inline with the story rather than on a page of their own.
 *
 * Each links out to its verifiable record where one exists. A certification nobody can
 * check is just a claim, so the link is the point - and an entry without one is rendered
 * plainly rather than as a dead link.
 */
export function CertificationsStrip({ items }: { items: Certification[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="certs-heading" className="mt-14">
      <h2 id="certs-heading" className="mb-4 text-xl font-semibold">
        Certifications
      </h2>

      <ul className="rm-grid grid gap-3 sm:grid-cols-2">
        {items.map((cert) => {
          const body = (
            <>
              <span className="block font-medium text-ink">{cert.name}</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                {cert.issuer} &middot; {issued(cert.issueDate)}
              </span>
            </>
          );

          return (
            <li
              key={`${cert.issuer}-${cert.name}`}
              className="surface surface-interactive p-4"
            >
              {cert.credentialUrl ? (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  {body}
                  <span className="mt-2 inline-block font-mono text-[0.7rem] tracking-wider text-signal uppercase">
                    Verify →
                  </span>
                </a>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
