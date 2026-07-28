"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const RECRUITER_COOKIE = "recruiterMode";

/**
 * Runs before first paint, inlined into <head>.
 *
 * Recruiter Mode has to be correct on the very first frame or it flashes the wrong
 * layout. The obvious way to get that is to read the cookie during SSR - but under
 * Cache Components, calling cookies() during render pulls every page out of the static
 * shell and forces request-time rendering site-wide. Stamping the attribute from a
 * blocking script keeps the pages prerenderable AND flash-free, which reading the
 * cookie on the server would not.
 */
export const recruiterModeScript = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${RECRUITER_COOKIE}=([^;]*)/);document.documentElement.dataset.recruiter=m&&m[1]==="1"?"on":"off"}catch(e){document.documentElement.dataset.recruiter="off"}})();`;

interface RecruiterModeValue {
  isRecruiterMode: boolean;
  toggle: () => void;
  /** False until the client has read the cookie, so SSR and hydration agree. */
  ready: boolean;
}

const RecruiterModeContext = createContext<RecruiterModeValue | null>(null);

export function RecruiterModeProvider({ children }: { children: ReactNode }) {
  // Always starts false so the server-rendered tree and the first client render match;
  // the real value arrives in the effect below. The visual mode is already correct by
  // then because the inline script set it before paint.
  const [isRecruiterMode, setIsRecruiterMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsRecruiterMode(document.documentElement.dataset.recruiter === "on");
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setIsRecruiterMode((previous) => {
      const next = !previous;
      document.documentElement.dataset.recruiter = next ? "on" : "off";
      // Lax rather than Strict: the choice should survive arriving from a link in an
      // email or an ATS, which is exactly how a recruiter reaches this site.
      document.cookie = `${RECRUITER_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <RecruiterModeContext value={{ isRecruiterMode, toggle, ready }}>
      {children}
    </RecruiterModeContext>
  );
}

export function useRecruiterMode(): RecruiterModeValue {
  const value = useContext(RecruiterModeContext);
  if (!value) {
    throw new Error("useRecruiterMode must be used inside a RecruiterModeProvider");
  }
  return value;
}
