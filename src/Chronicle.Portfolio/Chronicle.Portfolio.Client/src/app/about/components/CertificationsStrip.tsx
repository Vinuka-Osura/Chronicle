import type { Certification } from "@/lib/types";

function issued(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Credentials, inline with the story rather than on a page of their own.
 *
 * Each links out to its verifiable record where one exists. A certification nobody can
 * check is just a claim, so the link is the point — and an entry without one is rendered
 * plainly rather than as a dead link.
 */
export function CertificationsStrip({ items }: { items: Certification[] }) {
  if (items.length === 0) return null;

  return (
    <section className="scene" data-scene="Credentials" aria-labelledby="certs-heading">
      <p className="scene-eyebrow">Credentials</p>
      <h2 id="certs-heading" className="scene-heading">
        The ones with a record somebody else keeps.
      </h2>

      <ul className="cert-grid rm-grid" data-stagger>
        {items.map((cert) => {
          const body = (
            <>
              <span className="cert-name">{cert.name}</span>
              <span className="cert-issuer">
                {cert.issuer} &middot; {issued(cert.issueDate)}
              </span>
            </>
          );

          return (
            <li key={`${cert.issuer}-${cert.name}`} className="cert-card">
              {cert.credentialUrl ? (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cert-link"
                >
                  {body}
                  <span className="cert-verify">Verify →</span>
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
