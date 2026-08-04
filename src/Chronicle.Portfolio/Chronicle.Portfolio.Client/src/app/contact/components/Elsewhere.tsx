import { Facebook, GitHub, Instagram, LinkedIn, XMark } from "@/components/Icon";
import type { Profile } from "@/lib/types";

/**
 * The profile's handle on one platform, or nothing.
 *
 * `Icon` is the component rather than a rendered element so the row is data, not markup —
 * which is what lets the whole list be filtered before any of it is rendered.
 */
type Link = {
  label: string;
  url: string;
  Icon: (props: { className?: string }) => React.ReactElement;
  /** What is shown under the name. The handle, not the whole address. */
  handle: string;
};

/** The last meaningful path segment — "in/vinuka" reads better than the full URL. */
function handleOf(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const path = pathname.split("/").filter(Boolean).join("/");
    return path.length > 0 ? path : hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Where else to find this person.
 *
 * **Every row is driven by the CMS and absent rows are absent, not greyed out.** A social
 * list showing five icons where two are dead is worse than a list of two — it reads as
 * neglect, and a recruiter clicking a dead Instagram link learns something unintended.
 * So the array is built from whatever is set and the whole block disappears when nothing
 * is.
 *
 * The order is deliberate and not alphabetical: professional first. GitHub and LinkedIn
 * are the two anyone here to assess the work actually wants, and putting Instagram above
 * them would say something about priorities.
 */
export function Elsewhere({ profile }: { profile: Profile | null }) {
  if (!profile) return null;

  const links: Link[] = (
    [
      { label: "GitHub", url: profile.gitHubUrl, Icon: GitHub },
      { label: "LinkedIn", url: profile.linkedInUrl, Icon: LinkedIn },
      { label: "X", url: profile.xUrl, Icon: XMark },
      { label: "Instagram", url: profile.instagramUrl, Icon: Instagram },
      { label: "Facebook", url: profile.facebookUrl, Icon: Facebook },
    ] as const
  )
    .filter((link): link is typeof link & { url: string } => Boolean(link.url))
    .map((link) => ({ ...link, handle: handleOf(link.url) }));

  if (links.length === 0) return null;

  return (
    <div className="elsewhere">
      <h2 className="elsewhere-title">Elsewhere</h2>

      <ul className="elsewhere-list" data-stagger data-slide>
        {links.map(({ label, url, Icon, handle }) => (
          <li key={label}>
            <a href={url} target="_blank" rel="me noreferrer" className="elsewhere-link">
              <span className="elsewhere-icon" aria-hidden>
                <Icon />
              </span>
              <span className="elsewhere-text">
                <span className="elsewhere-label">{label}</span>
                <span className="elsewhere-handle">{handle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
