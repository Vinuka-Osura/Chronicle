/*
  NO "use client" DIRECTIVE, AND THAT IS THE POINT — the same point as
  `appearanceScript.ts`, learned the same way.

  This list started out in `SiteHeader.tsx`, which is a client module. The header
  imported it fine; the footer is a SERVER component, and a server component importing a
  plain value out of a client module does not get the value. The bundler substitutes a
  client reference, so `links.map` was a function call on a stub and the build failed
  with `i.links.map is not a function`.

  That failure was loud. The same mistake was silent the first time it happened here, in
  the pre-paint appearance script, where it produced a `<script>` that threw and left
  theming, Recruiter Mode and the whole motion tier switched off for weeks. If a value is
  shared between a server and a client component, it belongs in a module with no
  directive.
*/

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Every route on the site, in navigation order.
 *
 * One list, used by the header and the footer. Two hand-maintained copies is how a site
 * ends up with a page reachable from one and not the other, and nobody notices for
 * months.
 */
export const links: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/skills", label: "Skills" },
  { href: "/timeline", label: "Timeline" },
  { href: "/projects", label: "Projects" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/analytics", label: "Analytics" },
  { href: "/resume", label: "Résumé" },
  { href: "/ask", label: "Ask" },
  { href: "/contact", label: "Contact" },
];
