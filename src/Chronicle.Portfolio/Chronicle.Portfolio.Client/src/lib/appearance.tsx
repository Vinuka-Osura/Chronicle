"use client";

import { useCallback, useSyncExternalStore } from "react";

export const THEME_COOKIE = "theme";
export const RECRUITER_COOKIE = "recruiterMode";

export type Theme = "light" | "dark";

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
export const appearanceScript = `(function(){try{var d=document.documentElement,c=document.cookie;var t=c.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);var m=t&&t[1];if(m!=="dark"&&m!=="light"){m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=m;d.style.colorScheme=m;var r=c.match(/(?:^|;\\s*)${RECRUITER_COOKIE}=([^;]*)/);d.dataset.recruiter=r&&r[1]==="1"?"on":"off"}catch(e){document.documentElement.dataset.theme="light";document.documentElement.dataset.recruiter="off"}})();`;

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
    attributeFilter: ["data-theme", "data-recruiter"],
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
  }, []);

  return { theme, toggleTheme, isRecruiterMode, toggleRecruiterMode };
}
