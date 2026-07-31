"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sets a heading line by line, each line rising out from behind a mask.
 *
 * A heading that fades in is a div changing opacity. A heading whose lines rise from
 * behind an edge is **typesetting** — it reads as the words being placed rather than the
 * element appearing, and it is the single most recognisable signal that a site was made
 * by someone who cared.
 *
 * The lines are measured, not guessed. Text is rendered normally first, the browser
 * decides where it wraps, and only then is it split — so this survives any font, any
 * width, and any translation without a hard-coded break.
 *
 * **The text is always in the DOM and always readable.** Splitting adds spans around
 * words that are already there; it never replaces content with something that has to
 * animate before it can be read. If the effect never runs, the heading is simply a
 * heading.
 */
export function SetLines({
  children,
  className = "",
  as: Tag = "h1",
  delay = 0,
  id,
}: {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
  /** So a section can point `aria-labelledby` at the heading this renders. */
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (document.documentElement.dataset.motion === "still") {
      return;
    }

    /*
      Measure where the browser actually wrapped.

      Each word is wrapped in a span, their vertical offsets are read, and words sharing
      an offset belong to the same line. This is the only way to know the real breaks —
      character counting is wrong the moment the font loads or the viewport changes.
    */
    const measure = () => {
      const words = children.split(" ");
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none";
      probe.style.width = `${element.clientWidth}px`;
      probe.className = element.className;

      for (const word of words) {
        const span = document.createElement("span");
        span.textContent = `${word} `;
        probe.appendChild(span);
      }

      element.parentElement?.appendChild(probe);

      const grouped: string[] = [];
      let top: number | null = null;

      for (const span of probe.children) {
        const offset = (span as HTMLElement).offsetTop;
        if (top === null || offset !== top) {
          top = offset;
          grouped.push(span.textContent ?? "");
        } else {
          grouped[grouped.length - 1] += span.textContent ?? "";
        }
      }

      probe.remove();
      setLines(grouped.map((line) => line.trim()).filter(Boolean));
    };

    measure();

    // Re-measure on resize: the wrap points move, and lines masked at the old positions
    // would clip mid-word.
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children]);

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={className}
      data-set-lines={lines ? "" : undefined}
    >
      {lines
        ? lines.map((line, index) => (
            <span key={`${index}-${line}`} className="line-mask">
              <span
                className="line-inner"
                style={{ animationDelay: `${delay + index * 70}ms` }}
              >
                {line}
              </span>
            </span>
          ))
        : children}
    </Tag>
  );
}
