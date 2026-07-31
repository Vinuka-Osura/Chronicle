import Link from "next/link";
import { links } from "@/lib/navigation";

/** Build-time on the server, load-time in the browser. Identical but for one midnight. */
const YEAR = new Date().getFullYear();

const elsewhere = [
  { href: "https://github.com/Vinuka-Osura", label: "GitHub", external: true },
  { href: "/resume", label: "Résumé", external: false },
  { href: "/contact", label: "Get in touch", external: false },
];

/**
 * The end of the document, rather than a line of small print under it.
 *
 * A footer is the second most-used navigation on a site — it is where someone goes when
 * they have finished reading and have not yet found what they came for. One sentence and
 * two links, which is what this was, treats that moment as an afterthought.
 *
 * Four columns: who, everywhere you can go, everywhere else, and what it is made of. The
 * colophon is not decoration — on a portfolio whose whole argument is "the site is the
 * work sample", naming the stack in the footer is the argument.
 *
 * Opaque, like the header and the status strip. Chrome is solid; content floats.
 */
export function Footer() {
  return (
    <footer className="chrome mt-32 border-t border-rule">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <p className="font-mono text-xs tracking-[0.2em] text-ink uppercase">
              Sam Iversen
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              Backend engineer working on ledgers, statements and the reliability around
              them — the parts where being nearly right is the same as being wrong.
            </p>
          </div>

          <FooterColumn title="The site">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="footer-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Elsewhere">
            {elsewhere.map((item) =>
              item.external ? (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="footer-link"
                    rel="me noreferrer"
                    target="_blank"
                  >
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </FooterColumn>

          <FooterColumn title="Colophon">
            <li className="text-sm leading-relaxed text-ink-soft">
              .NET&nbsp;10, Aspire and PostgreSQL behind a Next.js&nbsp;16 front end.
              Content is served by an API and edited in a CMS, so nothing here needs a
              deploy to change.
            </li>
            <li className="pt-1">
              <Link href="/city" className="footer-link">
                Software City
              </Link>{" "}
              <span className="text-xs text-ink-faint">— in progress</span>
            </li>
          </FooterColumn>
        </div>

        {/*
          The wordmark, large and quiet. A site's name at the end of the document is a
          full stop: it says the page has finished rather than run out. Sized off the
          viewport so it is a piece of the layout on a wide screen and merely a label on
          a phone.
        */}
        <p
          aria-hidden
          className="mt-16 font-mono leading-none tracking-[0.28em] text-ink-faint/35 select-none"
          style={{ fontSize: "clamp(2rem, 11vw, 8rem)" }}
        >
          CHRONICLE
        </p>

        <div className="mt-6 flex flex-col gap-2 border-t border-rule pt-5 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          {/* The build year and the browser's year differ for one night a year, and the
              browser is the one that is right. */}
          <p suppressHydrationWarning>&copy; {YEAR} Sam Iversen. All rights reserved.</p>
          <p className="font-mono">Built in the open — the source is on GitHub.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={title}>
      <h2 className="font-mono text-[0.65rem] tracking-[0.16em] text-ink-faint uppercase">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </nav>
  );
}
