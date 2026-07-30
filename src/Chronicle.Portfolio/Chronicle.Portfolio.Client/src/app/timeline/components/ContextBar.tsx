"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { TimelineItemType } from "@/lib/types";
import { ALL_LENSES, LENSES, LENS_COOKIE, parseLenses } from "../lenses";

/*
  Lens state lives on <html data-lens="…">, not in React.

  The pre-paint script already put it there so CSS can hide filtered nodes on the first
  frame. Mirroring it into React state would create a second source of truth that can
  disagree — and syncing them would mean a setState inside an effect, which is the thing
  useSyncExternalStore exists to replace.
*/

function subscribeToLens(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-lens"],
  });
  return () => observer.disconnect();
}

const readLens = () => document.documentElement.dataset.lens ?? ALL_LENSES.join(" ");
const serverLens = () => ALL_LENSES.join(" ");

function useLenses(): [TimelineItemType[], (key: TimelineItemType) => void] {
  const raw = useSyncExternalStore(subscribeToLens, readLens, serverLens);
  const active = parseLenses(raw);

  const toggle = useCallback((key: TimelineItemType) => {
    const current = parseLenses(document.documentElement.dataset.lens);
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : ALL_LENSES.filter((k) => current.includes(k) || k === key);

    // Turning the last lens off would render a blank page that looks broken rather than
    // filtered, so the last one on cannot be switched off.
    const resolved = next.length > 0 ? next : current;

    document.documentElement.dataset.lens = resolved.join(" ");
    document.cookie = `${LENS_COOKIE}=${encodeURIComponent(resolved.join(" "))}; path=/; max-age=31536000; samesite=lax`;

    // replaceState rather than push: filtering is not a navigation, and it should not
    // fill the back button with every chip the visitor tried.
    const url = new URL(window.location.href);
    if (resolved.length === ALL_LENSES.length) {
      url.searchParams.delete("lens");
    } else {
      url.searchParams.set("lens", resolved.join(","));
    }
    window.history.replaceState(null, "", url);
  }, []);

  return [active, toggle];
}

/** Smooth unless the visitor asked for less motion, in which case instant. */
function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

export function ContextBar({ eraNames }: { eraNames: Record<string, string> }) {
  const [lenses, toggleLens] = useLenses();
  const [position, setPosition] = useState<{ era: string | null; year: string | null }>({
    era: null,
    year: null,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const markers = document.querySelectorAll<HTMLElement>("[data-era-marker], [data-year-marker]");
    if (markers.length === 0) return;

    // Fires from the observer callback, never synchronously in the effect body.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          setPosition((previous) => ({
            era: el.dataset.eraMarker ? (eraNames[el.dataset.eraMarker] ?? null) : previous.era,
            year: el.dataset.yearMarker ?? previous.year,
          }));
        }
      },
      // A band just below the sticky chrome: whatever crosses it is "where you are".
      { rootMargin: "-100px 0px -75% 0px" },
    );

    markers.forEach((m) => observer.observe(m));
    return () => observer.disconnect();
  }, [eraNames]);

  return (
    <div className="sticky top-14 z-40 -mx-4 mb-8 border-b border-rule bg-paper/90 px-4 backdrop-blur-sm sm:-mx-5 sm:px-5">
      <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-2 py-2">
        <p className="font-mono text-xs tracking-[0.14em] text-ink uppercase">
          {position.era ?? "Timeline"}
          {position.year && <span className="text-ink-faint"> &middot; {position.year}</span>}
        </p>

        {/* Desktop: chips inline. They are the legend as well as the filter. */}
        <ul className="hidden items-center gap-1.5 lg:flex" aria-label="Filter the timeline">
          {LENSES.map((lens) => (
            <li key={lens.key}>
              <LensChip
                lens={lens}
                active={lenses.includes(lens.key)}
                onToggle={() => toggleLens(lens.key)}
              />
            </li>
          ))}
        </ul>

        <div className="ms-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="lens-sheet"
            className="rounded-full border border-rule px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-signal hover:text-ink lg:hidden"
          >
            Lens ({lenses.length})
          </button>

          <nav aria-label="Jump to" className="flex items-center gap-1">
            <JumpButton onClick={() => scrollToId("timeline-start")} label="Start" glyph="⤒" />
            <JumpButton onClick={() => scrollToId("timeline-today")} label="Today" glyph="◉" />
            <JumpButton onClick={() => scrollToId("timeline-future")} label="Future" glyph="⤓" />
          </nav>
        </div>
      </div>

      {menuOpen && (
        <ul id="lens-sheet" className="flex flex-wrap gap-1.5 pb-3 lg:hidden">
          {LENSES.map((lens) => (
            <li key={lens.key}>
              <LensChip
                lens={lens}
                active={lenses.includes(lens.key)}
                onToggle={() => toggleLens(lens.key)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LensChip({
  lens,
  active,
  onToggle,
}: {
  lens: (typeof LENSES)[number];
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={lens.description}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-signal text-ink"
          : "border-rule text-ink-faint hover:border-ink-soft hover:text-ink-soft"
      }`}
    >
      <span aria-hidden className={active ? "text-signal" : ""}>
        {lens.glyph}
      </span>
      {lens.label}
    </button>
  );
}

function JumpButton({
  onClick,
  label,
  glyph,
}: {
  onClick: () => void;
  label: string;
  glyph: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-rule px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-signal hover:text-ink"
    >
      <span aria-hidden>{glyph}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">Jump to {label}</span>
    </button>
  );
}
