import Link from "next/link";
import { RecruiterToggle } from "./RecruiterToggle";

const links = [
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/timeline", label: "Timeline" },
  { href: "/projects", label: "Projects" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/analytics", label: "Analytics" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3"
      >
        <Link href="/" className="font-mono text-sm tracking-[0.2em] text-ink">
          CHRONICLE
        </Link>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto">
          <RecruiterToggle />
        </div>
      </nav>
    </header>
  );
}
