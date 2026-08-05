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
              {/*
                The issuer's badge, when there is one.

                `logoUrl` has been on this DTO since the beginning and nothing rendered
                it, so a Credly badge — which arrives with its artwork already — showed
                as text. A plain <img>, not next/image: the URL comes from the CMS or
                from Credly at request time, so there is no build-time knowledge to
                optimise against and a remote loader for an unknown host is a bigger
                surface than the saving is worth at 40px.

                Purely decorative. The name and issuer beside it already say what it is,
                so the alt is empty rather than a duplicate for a screen reader to read
                twice.
              */}
              {cert.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cert.logoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="cert-logo"
                />
              )}
              <span className="cert-name">{cert.name}</span>
              <span className="cert-issuer">
                {cert.issuer} &middot; {issued(cert.issueDate)}
              </span>
              {/*
                A credential that lapsed last March, shown as though it were current, is a
                false claim made silently — and the one nobody notices until a recruiter
                checks. Marked rather than removed: it still happened.
              */}
              {cert.isExpired && cert.expiryDate && (
                <span className="cert-expired">Expired {issued(cert.expiryDate)}</span>
              )}
            </>
          );

          return (
            <li
              key={`${cert.issuer}-${cert.name}`}
              className={`cert-card${cert.isExpired ? " is-expired" : ""}`}
            >
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
