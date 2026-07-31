"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { RecruiterToggle, ThemeToggle } from "./AppearanceToggles";

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

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/*
  usePathname is runtime data. Under Cache Components, reading it in the layout - which
  wraps every route - would drag pages with an already-dynamic shell, such as
  /projects/[slug], out of the static shell entirely and fail the build.

  So it is isolated to the two components below, each behind a Suspense boundary whose
  fallback renders the SAME markup with no pathname. Only `aria-current` and the
  underline arrive late; nothing moves, so there is no layout shift - just a link that
  becomes highlighted a beat after the page paints.
*/

function DesktopLinks({ pathname = "" }: { pathname?: string }) {
  return (
    <ul className="ml-4 hidden items-center gap-5 text-sm text-ink-soft lg:flex">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`transition-colors hover:text-ink ${
                active ? "text-ink underline decoration-signal underline-offset-8" : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveDesktopLinks() {
  return <DesktopLinks pathname={usePathname()} />;
}

function MobileLinks({
  pathname = "",
  onNavigate,
}: {
  pathname?: string;
  onNavigate: () => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded px-2 py-2 transition-colors hover:bg-paper-raised ${
                active ? "text-signal" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveMobileLinks({ onNavigate }: { onNavigate: () => void }) {
  return <MobileLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 border-b border-rule">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>

      <nav aria-label="Primary" className="mx-auto max-w-6xl px-4 sm:px-5">
        <div className="flex h-14 items-center gap-3">
          <Link
            href="/"
            className="font-mono text-sm tracking-[0.2em] text-ink"
            aria-label="Chronicle, home"
          >
            CHRONICLE
          </Link>

          {/* Eight links do not fit a phone, so they collapse below lg. */}
          <Suspense fallback={<DesktopLinks />}>
            <ActiveDesktopLinks />
          </Suspense>

          <div className="ml-auto flex items-center gap-2">
            <RecruiterToggle className="hidden sm:inline-flex" />
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors hover:border-signal hover:text-ink lg:hidden"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="size-4"
              >
                {open ? (
                  <path d="M5 5l14 14M19 5L5 19" />
                ) : (
                  <path d="M3 6h18M3 12h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-nav" className="border-t border-rule py-3 lg:hidden">
            {/* Closing on link click rather than on a pathname change keeps the menu
                free of another runtime-data dependency. */}
            <Suspense fallback={<MobileLinks onNavigate={() => setOpen(false)} />}>
              <ActiveMobileLinks onNavigate={() => setOpen(false)} />
            </Suspense>
            <div className="mt-3 px-2 sm:hidden">
              <RecruiterToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
