"use client";

import { useAppearance } from "@/lib/appearance";

/**
 * Light/dark switch.
 *
 * `ready` gates only the ARIA state, never the rendering: the button must exist in the
 * server HTML so the header does not reflow when React hydrates. Until the client has
 * read the DOM the label says "theme" rather than asserting the wrong current value.
 */
export function ThemeToggle() {
  const { theme, toggleTheme, ready } = useAppearance();
  const isDark = ready && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={ready ? `Switch to ${isDark ? "light" : "dark"} mode` : "Switch theme"}
      aria-label={ready ? `Switch to ${isDark ? "light" : "dark"} mode` : "Switch theme"}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors hover:border-signal hover:text-ink"
    >
      {/* Both icons ship; CSS picks one, so there is nothing to swap on hydration. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        className="size-4 dark:hidden"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden size-4 dark:block"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    </button>
  );
}

/**
 * Flips the whole site into the skim-optimised view.
 *
 * Labelled plainly rather than cleverly: the person it is built for has about sixty
 * seconds and should not have to decode an icon.
 */
export function RecruiterToggle({ className = "" }: { className?: string }) {
  const { isRecruiterMode, toggleRecruiterMode, ready } = useAppearance();

  return (
    <button
      type="button"
      onClick={toggleRecruiterMode}
      role="switch"
      aria-checked={ready ? isRecruiterMode : false}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-signal hover:text-ink ${className}`}
    >
      <span
        aria-hidden
        className="relative h-3.5 w-6 rounded-full bg-rule transition-colors group-aria-checked:bg-signal"
      >
        <span className="absolute top-0.5 left-0.5 size-2.5 rounded-full bg-paper-raised transition-transform group-aria-checked:translate-x-2.5" />
      </span>
      Recruiter mode
    </button>
  );
}
