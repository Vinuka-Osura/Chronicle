"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DIAGRAM_GEOMETRY, parseDiagram, type Diagram } from "@/lib/diagram";

const { NODE_WIDTH, NODE_HEIGHT } = DIAGRAM_GEOMETRY;

/** Each edge draws, then the next begins. Slow enough to follow, brief enough to watch. */
const EDGE_MS = 420;
const STAGGER_MS = 160;

/**
 * An architecture diagram that shows the system working.
 *
 * The alternative was an uploaded PNG, and this beats it on every axis that matters: it
 * themes with the site because it is drawn from the same tokens, it is selectable text
 * so it is searchable and readable by a screen reader, it weighs a couple of kilobytes
 * instead of a couple of hundred, and it cannot go stale — it is generated from the
 * description, so changing the description changes the picture.
 *
 * **The sequence plays once, on scroll into view, with a replay control.** Looping was
 * the obvious thing and is the wrong thing: a diagram pulsing away in the middle of a
 * case study competes with the prose it is meant to support, and motion that never
 * resolves is exhausting to read next to.
 */
export function ArchitectureDiagram({
  source,
  caption,
}: {
  source: string | null | undefined;
  caption?: string;
}) {
  const diagram = parseDiagram(source);
  const containerRef = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !diagram) return;

    // Someone who asked for less motion gets the finished diagram, not a faster
    // version of the animation.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.recruiter === "on"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPlaying(true);
        setRun((n) => n + 1);
        // Once. The replay button is the only way to see it again, which is the
        // difference between an animation and a distraction.
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [diagram]);

  if (!diagram) {
    return null;
  }

  return (
    <figure ref={containerRef} className="my-8">
      <div className="surface overflow-x-auto p-4">
        <svg
          key={run}
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          width={diagram.width}
          height={diagram.height}
          role="img"
          aria-labelledby={titleId}
          className={`block max-w-full ${playing ? "diagram-playing" : ""}`}
          style={{ ["--edge-ms" as string]: `${EDGE_MS}ms` }}
        >
          {/*
            The accessible description is generated from the same source the picture is,
            so it cannot describe a different system from the one drawn. This is the part
            an uploaded image can never do.
          */}
          <title id={titleId}>{describe(diagram, caption)}</title>

          <defs>
            <marker
              id={`arrow-${titleId}`}
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--color-ink-faint)" />
            </marker>
          </defs>

          {diagram.edges.map((edge) => {
            const from = diagram.nodes.find((n) => n.id === edge.from);
            const to = diagram.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;

            const path = edgePath(from, to);
            const delay = edge.step * STAGGER_MS;

            return (
              <g key={`${edge.from}-${edge.to}-${edge.step}`}>
                <path
                  d={path}
                  className="diagram-edge"
                  fill="none"
                  stroke="var(--color-ink-faint)"
                  strokeWidth="1.5"
                  markerEnd={`url(#arrow-${titleId})`}
                  style={{ animationDelay: `${delay}ms` }}
                />
                {edge.label && (
                  <text
                    x={(from.x + NODE_WIDTH + to.x) / 2}
                    y={(from.y + to.y) / 2 + NODE_HEIGHT / 2 - 6}
                    textAnchor="middle"
                    className="diagram-label fill-ink-faint font-mono text-[9px]"
                    style={{ animationDelay: `${delay + EDGE_MS * 0.6}ms` }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {diagram.nodes.map((node) => (
            <g
              key={node.id}
              className="diagram-node"
              // Nodes light up as the flow reaches them, so the sequence reads as a
              // request travelling rather than a picture assembling itself.
              style={{ animationDelay: `${node.depth * STAGGER_MS}ms` }}
            >
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="6"
                fill="var(--color-paper)"
                stroke="var(--color-rule)"
                strokeWidth="1"
              />
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + NODE_HEIGHT / 2 + 4}
                textAnchor="middle"
                className="fill-ink font-sans text-[11px] font-medium"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-3 text-xs text-ink-faint">
        <span>{caption ?? "How the pieces fit together."}</span>
        <button
          type="button"
          className="rm-hide text-signal underline underline-offset-2"
          onClick={() => {
            setPlaying(true);
            // Remounting the SVG is what restarts CSS animations; re-triggering them in
            // place means clearing and forcing reflow on every element, which is more
            // code to do the same thing less reliably.
            setRun((n) => n + 1);
          }}
        >
          Replay
        </button>
      </figcaption>

    </figure>
  );
}

/** A gentle S-curve between columns, straight within one. */
function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const startX = from.x + NODE_WIDTH;
  const startY = from.y + NODE_HEIGHT / 2;
  const endX = to.x;
  const endY = to.y + NODE_HEIGHT / 2;

  if (Math.abs(startY - endY) < 1) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  // Control points sit halfway across, so the curve leaves and arrives horizontally and
  // the arrowhead always meets the box square-on.
  const midX = (startX + endX) / 2;
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
}

/**
 * The diagram in a sentence, for anyone who is not looking at it.
 */
function describe(diagram: Diagram, caption?: string): string {
  const flows = diagram.edges
    .map((edge) => `${edge.from} to ${edge.to}${edge.label ? ` over ${edge.label}` : ""}`)
    .join("; ");

  // The caption usually ends in a full stop already; adding another reads as a stutter
  // when a screen reader speaks it.
  const opening = (caption ?? "Architecture diagram").replace(/\.\s*$/, "");

  return `${opening}. ${diagram.nodes.length} components: ${diagram.nodes
    .map((node) => node.label)
    .join(", ")}. Connections: ${flows}.`;
}
