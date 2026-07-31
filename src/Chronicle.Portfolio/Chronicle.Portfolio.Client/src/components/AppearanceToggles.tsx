"use client";

import { useAppearance } from "@/lib/appearance";

/**
 * Light/dark switch.
 *
 * Both icons ship and CSS picks one, so the visible state is correct from the first
 * paint - it follows the `data-theme` attribute the pre-paint script already set,
 * with no JavaScript involved. Only the label needs the resolved value.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useAppearance();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors hover:border-signal hover:text-ink"
    >
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
  const { isRecruiterMode, toggleRecruiterMode } = useAppearance();

  return (
    <button
      type="button"
      onClick={toggleRecruiterMode}
      role="switch"
      aria-checked={isRecruiterMode}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-signal hover:text-ink ${className}`}
    >
      <span
        aria-hidden
        className="relative h-3.5 w-6 rounded-full bg-rule transition-colors group-aria-checked:bg-signal"
      >
        {/* The knob is a solid object, so it takes the opaque surface rather than the
            glass one — a translucent switch handle reads as broken. */}
        <span className="absolute top-0.5 left-0.5 size-2.5 rounded-full bg-paper-solid transition-transform group-aria-checked:translate-x-2.5" />
      </span>
      Recruiter mode
    </button>
  );
}
