"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
  Re-exported, not redefined. These live in `appearanceScript.ts`, which has no
  "use client" directive, because the root layout is a SERVER component and importing a
  plain value from a client module yields a throwing stub rather than the value. See the
  comment at the top of that file — it cost a silent, total failure of theming.

  `appearanceScript` itself is deliberately NOT re-exported here. Doing so would put a
  working-looking import path for it back inside a client module, and the next server
  component to reach for it would get the same throwing stub with no warning. Import it
  from `@/lib/appearanceScript` directly.
*/
export {
  THEME_COOKIE,
  RECRUITER_COOKIE,
  type Theme,
  type MotionTier,
} from "./appearanceScript";

import { THEME_COOKIE, RECRUITER_COOKIE, applyMotionTier } from "./appearanceScript";
import type { Theme } from "./appearanceScript";

/**
 * Runs before first paint, inlined into <head>.
 *
 * One script stamps both appearance attributes, deliberately. They are the same problem
 * twice - a cookie-persisted preference that must be correct on the very first frame or
 * the user watches the page change under them - and two separate blocking scripts would
 * be two chances to flash.
 *
 * Reading the cookies during SSR would be the obvious alternative, but under Cache
 * Components calling cookies() in a layout drags every page out of the static shell and
 * forces request-time rendering site-wide. This keeps the pages prerenderable AND
 * flash-free.
 *
 * Theme falls back to the OS preference when no cookie is set, so a first-time visitor
 * gets what their system already asked for rather than an arbitrary default.
 */
/**
 * Motion tiers, decided once before first paint.
 *
 * `full` gets everything. `reduced` keeps scroll and reveals but no WebGL and no
 * per-frame work. `still` moves nothing at all.
 *
 * **This is what allows the default to be greedy.** Recruiter Mode is opt-in, so a
 * visitor on a weak phone who never finds the toggle would otherwise just get a bad
 * site. Deciding here — pre-paint, from what the device reports about itself — means the
 * rich version can be uncompromising because it is not the only version.
 *
 * Read from `navigator`: deviceMemory and hardwareConcurrency where available, plus the
 * Save-Data header and effective connection type. All are hints rather than truth, so
 * the thresholds are generous — the cost of over-delivering to a capable phone is a
 * dropped frame, and the cost of under-delivering is a site that looks broken.
 */


/*
  The <html> data attributes are the single source of truth, not React state.

  The pre-paint script writes them before React exists, so mirroring them into state
  would mean two sources that can disagree - and the obvious way to sync them, a
  setState inside useEffect, is exactly what react-hooks/set-state-in-effect warns
  about. useSyncExternalStore is the primitive built for this: subscribe to an external
  mutable source, with a server snapshot for hydration.
*/

function subscribeToRoot(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-recruiter", "data-motion"],
  });
  return () => observer.disconnect();
}

const readTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

const readRecruiterMode = (): boolean =>
  document.documentElement.dataset.recruiter === "on";

// Used for SSR and for the hydrating render, so server and client agree; React then
// re-reads the live value immediately afterwards.
const serverTheme = (): Theme => "light";
const serverRecruiterMode = () => false;

function writeCookie(name: string, value: string) {
  // Lax rather than Strict: the preference should survive arriving from a link in an
  // email or an ATS, which is exactly how a recruiter reaches this site.
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

export interface Appearance {
  theme: Theme;
  toggleTheme: () => void;
  isRecruiterMode: boolean;
  toggleRecruiterMode: () => void;
}

export function useAppearance(): Appearance {
  const theme = useSyncExternalStore(subscribeToRoot, readTheme, serverTheme);
  const isRecruiterMode = useSyncExternalStore(
    subscribeToRoot,
    readRecruiterMode,
    serverRecruiterMode,
  );

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    // Keeps native controls, scrollbars and form widgets in step with the page.
    root.style.colorScheme = next;
    writeCookie(THEME_COOKIE, next);
  }, []);

  const toggleRecruiterMode = useCallback(() => {
    const root = document.documentElement;
    const next = root.dataset.recruiter !== "on";
    root.dataset.recruiter = next ? "on" : "off";
    writeCookie(RECRUITER_COOKIE, next ? "1" : "0");

    /*
      The line this was missing.

      Recruiter Mode is one of the two things that force the `still` motion tier, and
      the tier is what the water, the inertial scroll and every animated rule actually
      read. Setting `data-recruiter` alone left all of them running, so the mode only
      appeared to work after a reload — when the pre-paint script recomputed the tier.
    */
    applyMotionTier();
  }, []);

  return { theme, toggleTheme, isRecruiterMode, toggleRecruiterMode };
}
