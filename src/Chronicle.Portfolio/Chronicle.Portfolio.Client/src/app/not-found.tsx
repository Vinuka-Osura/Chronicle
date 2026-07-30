import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  // Reached both by a genuine 404 and by notFound() inside a streaming route, where the
  // status has already been sent as 200. Either way it should never be indexed.
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="max-w-xl py-8">
      <p className="mb-3 font-mono text-xs tracking-[0.2em] text-signal uppercase">
        Not found
      </p>

      <h1 className="text-title mb-4 font-semibold">
        There is nothing at this address.
      </h1>

      <p className="mb-8 text-ink-soft">
        The page may have been renamed, or it may never have existed. Neither is your
        fault.
      </p>

      <nav aria-label="Where to go instead">
        <ul className="flex flex-wrap gap-3">
          {[
            { href: "/", label: "Home" },
            { href: "/projects", label: "Projects" },
            { href: "/timeline", label: "Timeline" },
            { href: "/knowledge", label: "Knowledge" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-block rounded-md border border-rule px-4 py-2 text-sm font-medium transition-colors hover:border-signal"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
