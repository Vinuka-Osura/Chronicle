import Link from "next/link";
import { links } from "@/lib/navigation";

/** Build-time on the server, load-time in the browser. Identical but for one midnight. */
const YEAR = new Date().getFullYear();

/**
 * Icons are inline SVG on `currentColor`, not an icon package.
 *
 * Six glyphs do not justify a dependency, a tree-shaking config and a second set of
 * naming conventions — and inlining them means they inherit the link's colour and its
 * hover transition for free, which an icon font or an <img> would not.
 *
 * 1.5 stroke on a 24 viewBox, sized at 1rem, so they sit at the weight of the text
 * beside them rather than shouting over it.
 */
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function GitHubIcon() {
  // Filled rather than stroked: the mark is only recognisable as a silhouette.
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.53.1.72-.23.72-.5v-1.8c-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.96-.66.07-.64.07-.64 1.06.07 1.61 1.09 1.61 1.09.94 1.6 2.47 1.14 3.07.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.2 0-1.15.41-2.09 1.09-2.83-.11-.27-.47-1.34.1-2.8 0 0 .88-.28 2.89 1.08a10 10 0 0 1 5.26 0c2-1.36 2.88-1.08 2.88-1.08.58 1.46.21 2.53.11 2.8.68.74 1.09 1.68 1.09 2.83 0 4.04-2.46 4.93-4.8 5.19.38.33.71.97.71 1.96v2.9c0 .28.19.61.72.5A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm6.5 0h3.8v1.64h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.66c0-1.35-.03-3.09-1.95-3.09-1.96 0-2.26 1.47-2.26 2.99V21h-4V9Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 6.5 8.2 5.6a1.4 1.4 0 0 0 1.6 0L21 6.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg {...iconProps}>
      <path d="M14 2.75H7A1.75 1.75 0 0 0 5.25 4.5v15A1.75 1.75 0 0 0 7 21.25h10a1.75 1.75 0 0 0 1.75-1.75V7.5Z" />
      <path d="M14 2.75V7.5h4.75M8.5 13h7M8.5 16.5h4.5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg {...iconProps} width={12} height={12}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

const elsewhere = [
  {
    href: "https://github.com/Vinuka-Osura",
    label: "GitHub",
    icon: <GitHubIcon />,
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/vinuka-osura-anupama/",
    label: "LinkedIn",
    icon: <LinkedInIcon />,
    external: true,
  },
  { href: "/resume", label: "Résumé", icon: <DocumentIcon />, external: false },
  { href: "/contact", label: "Get in touch", icon: <MailIcon />, external: false },
];

/**
 * The end of the document, rather than a line of small print under it.
 *
 * A footer is the second most-used navigation on a site — it is where someone goes when
 * they have finished reading and have not yet found what they came for.
 *
 * **The wordmark is gone.** A site's name set at 11vw is a full stop, and it read as one
 * — but it added the height of a small screen to every page on the site to say something
 * the header already says, and the tab title says, and the copyright line below says
 * again. Three of those are load-bearing; the fourth was decoration charging rent.
 *
 * The site column is a two-up grid rather than a single stack, which halves the row count
 * for the same eight links. Between that and the wordmark, the footer is roughly a third
 * of the height it was.
 *
 * Opaque, like the header and the status strip. Chrome is solid; content floats.
 */
export function Footer() {
  return (
    <footer className="chrome mt-24 border-t border-rule">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-7 sm:px-5">
        <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-mono text-xs tracking-[0.2em] text-ink uppercase">
              Vinuka Osura Anupama
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              Full-stack software engineer working on enterprise systems — backend
              services, the databases under them, and the architecture that keeps both
              maintainable as the requirements move.
            </p>

            {/* The same destinations as the Elsewhere column, as marks. A row of icons is
                found by shape at a glance; the column beside it is for anyone who would
                rather read the word. Labelled, because an icon alone is a guess. */}
            <ul className="mt-4 flex items-center gap-2">
              {elsewhere.map((item) => (
                <li key={`mark-${item.href}`}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="footer-mark"
                      rel="me noreferrer"
                      target="_blank"
                      aria-label={item.label}
                      title={item.label}
                    >
                      {item.icon}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="footer-mark"
                      aria-label={item.label}
                      title={item.label}
                    >
                      {item.icon}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="The site" className="lg:col-span-4">
            <h2 className="font-mono text-[0.65rem] tracking-[0.16em] text-ink-faint uppercase">
              The site
            </h2>
            {/* Two-up: eight links in four rows rather than eight. */}
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Elsewhere" className="lg:col-span-2">
            <h2 className="font-mono text-[0.65rem] tracking-[0.16em] text-ink-faint uppercase">
              Elsewhere
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {elsewhere.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="footer-link inline-flex items-center gap-1.5"
                      rel="me noreferrer"
                      target="_blank"
                    >
                      {item.label}
                      <ExternalIcon />
                    </a>
                  ) : (
                    <Link href={item.href} className="footer-link">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="font-mono text-[0.65rem] tracking-[0.16em] text-ink-faint uppercase">
              Colophon
            </h2>
            {/* Not decoration: on a portfolio whose whole argument is "the site is the
                work sample", naming the stack in the footer is the argument. */}
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              .NET&nbsp;10, Aspire and PostgreSQL behind a Next.js&nbsp;16 front end.
              Content is served by an API and edited in a CMS, so nothing here needs a
              deploy to change.
            </p>
            {/* Kept, because this is the only link to it anywhere on the site — /city is
                not in the header nav, so dropping it here would orphan the route. */}
            <p className="mt-3 text-sm">
              <Link href="/city" className="footer-link">
                Software City
              </Link>{" "}
              <span className="text-xs text-ink-faint">— in progress</span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-rule pt-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          {/* The build year and the browser's year differ for one night a year, and the
              browser is the one that is right. */}
          <p suppressHydrationWarning>
            &copy; {YEAR} Vinuka Osura Anupama. All rights reserved.
          </p>
          <p className="font-mono">Built in the open — the source is on GitHub.</p>
        </div>
      </div>
    </footer>
  );
}
