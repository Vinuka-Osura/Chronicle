import { getSiteStatus } from "../api";

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/**
 * The live strip: what is being worked on right now.
 *
 * Every field degrades independently. If the API is unreachable the strip renders
 * nothing at all rather than an error, and the page above it is unaffected - a portfolio
 * should not break because a status line could not load.
 *
 * The last-commit half comes from the server's cached GitHub payload, so it costs a row
 * read rather than a network call. When GitHub is unreachable it is simply absent: a
 * status strip that invents data is worse than one that omits it.
 */
export async function StatusStrip() {
  const status = await getSiteStatus();

  if (!status) return null;

  return (
    <aside
      aria-label="Current status"
      className="rm-compact mb-12 flex flex-col gap-3 rounded-lg border border-rule bg-paper-raised px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"
    >
      <p className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-signal motion-safe:animate-pulse"
        />
        <span className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-faint uppercase">
          Now
        </span>
        <span className="text-ink">{status.currentFocus}</span>
      </p>

      {status.lastCommit && (
        <p className="text-ink-soft">
          <span className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-faint uppercase">
            Last commit
          </span>{" "}
          <span className="text-ink">{status.lastCommit.message}</span>{" "}
          <span className="text-ink-faint">
            in {status.lastCommit.repo}, {relativeTime(status.lastCommit.when)}
          </span>
        </p>
      )}

      {status.mood && (
        <p className="rm-hide text-ink-soft sm:ml-auto">
          <span className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-faint uppercase">
            Mood
          </span>{" "}
          {status.mood}
        </p>
      )}
    </aside>
  );
}

/** Reserves the strip's height so streaming it in does not shift the hero below. */
export function StatusStripSkeleton() {
  return (
    <div
      aria-hidden
      className="mb-12 h-[3.25rem] animate-pulse rounded-lg border border-rule bg-paper-raised"
    />
  );
}
