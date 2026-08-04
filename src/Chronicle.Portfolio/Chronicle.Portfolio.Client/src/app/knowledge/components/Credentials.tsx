import { External } from "@/components/Icon";
import type { CredentialBadge } from "@/lib/types";

function monthYear(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Certifications and badges, merged from the CMS and from Credly.
 *
 * **Expiry is shown, not hidden.** A credential that lapsed last March presented as
 * current is a false claim on a portfolio, and the kind nobody notices until a recruiter
 * checks. Where an expiry date exists and has passed, the badge says so and is visually
 * demoted rather than removed — it still happened.
 *
 * The `source` chip is deliberate. A reader can tell a line typed into a CMS from one a
 * third party will confirm, and the honest thing is to let them.
 */
export function Credentials({
  badges,
  today,
}: {
  badges: CredentialBadge[];
  /** The server's date. A Server Component may not read the clock under Cache Components. */
  today: string;
}) {
  if (badges.length === 0) return null;

  return (
    <ul className="credentials rm-grid" data-stagger data-pop>
      {badges.map((badge) => {
        const expired = badge.expiresAt !== null && badge.expiresAt < today;

        return (
          <li
            key={`${badge.name}-${badge.issuer}`}
            className={`credential card${expired ? " is-expired" : ""}`}
          >
            <div className="card-body credential-body">
              {badge.imageUrl ? (
                /* A plain <img>: the URL comes from Credly or the CMS at request time, so
                   there is no build-time knowledge to optimise against, and configuring a
                   remote loader for an unknown host is a bigger surface than the saving.
                   Same reasoning as ProjectCard's plate. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={badge.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="credential-image"
                />
              ) : (
                <span className="credential-image is-placeholder" aria-hidden>
                  {badge.issuer.slice(0, 1)}
                </span>
              )}

              <div className="credential-text">
                <h3 className="credential-name">
                  {badge.url ? (
                    <a
                      href={badge.url}
                      target="_blank"
                      rel="noreferrer"
                      className="after:absolute after:inset-0 after:content-['']"
                    >
                      {badge.name}
                    </a>
                  ) : (
                    badge.name
                  )}
                </h3>

                <p className="credential-issuer">{badge.issuer}</p>

                <p className="credential-meta">
                  {badge.issuedAt && <span>{monthYear(badge.issuedAt)}</span>}
                  {badge.expiresAt && (
                    <span className={expired ? "credential-expired" : "credential-expires"}>
                      {expired ? "Expired " : "Renews "}
                      {monthYear(badge.expiresAt)}
                    </span>
                  )}
                  {badge.source === "credly" && (
                    <span className="credential-source">Verifiable</span>
                  )}
                  {badge.url && <External className="credential-icon" />}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
