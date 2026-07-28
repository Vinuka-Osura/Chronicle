"use client";

import { useRecruiterMode } from "@/lib/recruiter-mode";

/**
 * Flips the whole site into the skim-optimised view.
 *
 * Labelled plainly rather than cleverly: the person it is built for has about sixty
 * seconds and should not have to work out what a cute icon means.
 */
export function RecruiterToggle() {
  const { isRecruiterMode, toggle, ready } = useRecruiterMode();

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={ready ? isRecruiterMode : false}
      className="group inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-signal hover:text-ink"
    >
      <span
        aria-hidden
        className="relative h-3.5 w-6 rounded-full bg-rule transition-colors group-aria-checked:bg-signal"
      >
        <span className="absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-paper-raised transition-transform group-aria-checked:translate-x-2.5" />
      </span>
      Recruiter mode
    </button>
  );
}
