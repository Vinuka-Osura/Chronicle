/*
  NO "use client" DIRECTIVE, AND THAT IS THE POINT — the same reason `navigation.ts` has
  none. This is imported by a Server Component (the case study) and a Client Component
  (the skill card), and a server module importing a value out of a client module gets a
  bundler stub rather than the value.
*/

/**
 * A stable DOM id for a named thing, so one page can link to a specific card on another.
 *
 * The two ends have to agree exactly or the link silently lands at the top of the page
 * instead of the card, which looks like the anchor "not working" rather than like a
 * mismatch. One function, called from both ends, is what stops that.
 *
 * Deliberately lossy in a predictable way: `.NET` and `Next.js` both keep their dots
 * collapsed to hyphens, and `C#` becomes `c`. Collisions are possible in principle but
 * every skill name is unique in the database already, and a wrong-but-close anchor is a
 * scroll position, not a broken page.
 */
export function anchorId(prefix: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${prefix}-${slug || "item"}`;
}
