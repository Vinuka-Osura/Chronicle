"use client";

import { useEffect, useState } from "react";
import { scrollToId } from "@/lib/scroll";

export type GuideEntry = {
  /** The `id` on the section this jumps to. */
  id: string;
  label: string;
  /** How many things are in it. Absent where a count would mean nothing. */
  count?: number;
};

/**
 * What is on this page, and how far down.
 *
 * The page carries four unrelated kinds of thing and is several screens long, so without
 * this a reader has to scroll the whole way to discover whether the part they came for
 * exists at all. The counts are the useful half — "Certifications 5" answers the question
 * before the jump does.
 *
 * **Entries are built from what actually rendered**, so a section with nothing in it is
 * absent here as well as absent below. A guide listing a destination that does not exist
 * is worse than no guide.
 */
export function SectionGuide({ entries }: { entries: GuideEntry[] }) {
  // One entry is not a guide, it is a label for the only thing on the page.
  const [current, setCurrent] = useState<string | null>(entries[0]?.id ?? null);

  /*
    Which section the reader is actually in.

    `rootMargin` pulls the detection band up to just under the fixed header and down to
    roughly a third of the viewport, so the active entry changes when a section reaches
    reading position rather than when its first pixel appears at the bottom of the screen.
    Sorting by position matters: several sections can intersect that band at once on a
    short one, and the topmost is the one being read.
  */
  useEffect(() => {
    if (entries.length < 2) return;

    const sections = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      () => {
        const visible = sections
          .map((section) => ({ id: section.id, top: section.getBoundingClientRect().top }))
          .filter((section) => section.top < window.innerHeight * 0.5)
          .sort((a, b) => b.top - a.top);

        if (visible.length > 0) setCurrent(visible[0].id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: [0, 0.1, 0.5, 1] },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav className="guide rm-hide" aria-label="Sections on this page">
      <ul className="guide-list" data-stagger data-slide>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={current === entry.id ? "true" : undefined}
              className="guide-link"
              onClick={(event) => {
                // Only intercept a plain click. Ctrl, meta and middle-click all mean
                // "open this somewhere else", and a preventDefault would break them.
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                scrollToId(entry.id);
                // The hash is still set, so the address bar and the back button behave
                // exactly as they would have without the interception.
                history.replaceState(null, "", `#${entry.id}`);
              }}
            >
              {entry.label}
              {entry.count !== undefined && (
                <span className="guide-count">{entry.count}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
