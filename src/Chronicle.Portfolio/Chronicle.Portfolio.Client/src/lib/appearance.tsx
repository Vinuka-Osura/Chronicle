"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

function writeCookie(name: string, value: string) {
  // Lax rather than Strict: the preference should survive arriving from a link in an
  // email or an ATS, which is exactly how a recruiter reaches this site.
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

interface AppearanceValue {
  theme: Theme;
  toggleTheme: () => void;
  isRecruiterMode: boolean;
  toggleRecruiterMode: () => void;
  /** False until the client has read the DOM, so SSR and hydration agree. */
  ready: boolean;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  // Both start at their server-rendered defaults so the first client render matches the
  // HTML. The real values arrive in the effect below; the visuals are already correct
  // because the inline script set the attributes before paint.
  const [theme, setTheme] = useState<Theme>("light");
  const [isRecruiterMode, setIsRecruiterMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.dataset.theme === "dark" ? "dark" : "light");
    setIsRecruiterMode(root.dataset.recruiter === "on");
    setReady(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((previous) => {
      const next: Theme = previous === "dark" ? "light" : "dark";
      const root = document.documentElement;
      root.dataset.theme = next;
      // Keeps native controls, scrollbars and form widgets in step with the page.
      root.style.colorScheme = next;
      writeCookie(THEME_COOKIE, next);
      return next;
    });
  }, []);

  const toggleRecruiterMode = useCallback(() => {
    setIsRecruiterMode((previous) => {
      const next = !previous;
      document.documentElement.dataset.recruiter = next ? "on" : "off";
      writeCookie(RECRUITER_COOKIE, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <AppearanceContext
      value={{ theme, toggleTheme, isRecruiterMode, toggleRecruiterMode, ready }}
    >
      {children}
    </AppearanceContext>
  );
}

export function useAppearance(): AppearanceValue {
  const value = useContext(AppearanceContext);
  if (!value) {
    throw new Error("useAppearance must be used inside an AppearanceProvider");
  }
  return value;
}
