"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Timeline } from "@/lib/types";

interface YearBar {
  year: string;
  count: number;
  /** 0-1, relative to the busiest year. */
  intensity: number;
  eraId: string | null;
  eraName: string | null;
  isFuture: boolean;
}

function buildBars(timeline: Timeline): YearBar[] {
  const byYear = new Map<string, { count: number; eraId: string | null }>();

  for (const item of timeline.items) {
    const year = item.date.slice(0, 4);
    const existing = byYear.get(year);
    if (existing) {
      existing.count += 1;
    } else {
      byYear.set(year, { count: 1, eraId: item.eraId });
    }
  }

  const busiest = Math.max(1, ...[...byYear.values()].map((v) => v.count));
  const eraNames = new Map(timeline.eras.map((e) => [e.id, e.name]));
  const thisYear = timeline.today.slice(0, 4);

  return [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, v]) => ({
      year,
      count: v.count,
      intensity: v.count / busiest,
      eraId: v.eraId,
      eraName: v.eraId ? (eraNames.get(v.eraId) ?? null) : null,
      isFuture: year > thisYear,
    }));
}

/**
 * The bottom scrubber: named chapters, event density per year, and current position —
 * one component doing the job of three.
 *
 * Density is the "how busy was that period" read, the era segments are the overview,
 * and clicking travels. Building these separately would have meant three sets of
 * scroll listeners and three things to keep aligned.
 */
export function Scrubber({ timeline }: { timeline: Timeline }) {
  const bars = buildBars(timeline);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    // Which year is in view. Same observer band as the context bar, so the two agree.
    const markers = document.querySelectorAll<HTMLElement>("[data-year-marker]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveYear((entry.target as HTMLElement).dataset.yearMarker ?? null);
          }
        }
      },
      { rootMargin: "-100px 0px -75% 0px" },
    );
    markers.forEach((m) => observer.observe(m));

    // Reading reclaims the 40px: hide going down, return coming up.
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastScroll.current && y > 240);
      lastScroll.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const travelTo = useCallback((year: string) => {
    const target = document.getElementById(`year-${year}`);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, []);

  if (bars.length === 0) return null;

  return (
    <div
      className={`rm-hide fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 backdrop-blur-sm transition-transform duration-200 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-end gap-px overflow-x-auto px-4 pt-2 pb-1 sm:px-5">
        {bars.map((bar, index) => {
          const previous = bars[index - 1];
          const startsEra = bar.eraId !== previous?.eraId;

          return (
            <div key={bar.year} className="flex min-w-0 flex-1 flex-col items-stretch">
              {startsEra && bar.eraName && (
                <p className="truncate border-l border-rule pl-1 font-mono text-[0.55rem] tracking-[0.1em] text-ink-faint uppercase">
                  {bar.eraName}
                </p>
              )}

              <button
                type="button"
                onClick={() => travelTo(bar.year)}
                title={`${bar.year} — ${bar.count} ${bar.count === 1 ? "entry" : "entries"}${bar.eraName ? ` · ${bar.eraName}` : ""}`}
                aria-label={`Jump to ${bar.year}, ${bar.count} ${bar.count === 1 ? "entry" : "entries"}`}
                aria-current={activeYear === bar.year ? "true" : undefined}
                className="group flex flex-col justify-end px-px pt-1"
                style={{ height: "2.25rem" }}
              >
                <span
                  aria-hidden
                  className={`block w-full rounded-sm transition-colors ${
                    activeYear === bar.year
                      ? "bg-signal"
                      : bar.isFuture
                        ? "bg-rule group-hover:bg-ink-faint"
                        : "bg-ink-faint/50 group-hover:bg-signal"
                  }`}
                  // Floor of 15% so a one-entry year is still a visible, clickable target
                  // rather than a hairline nobody can hit.
                  style={{ height: `${15 + bar.intensity * 85}%` }}
                />
              </button>

              <span
                aria-hidden
                className={`truncate text-center font-mono text-[0.55rem] ${
                  activeYear === bar.year ? "text-signal" : "text-ink-faint"
                }`}
              >
                {bar.year.slice(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
