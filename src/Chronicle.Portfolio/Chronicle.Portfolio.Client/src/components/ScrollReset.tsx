"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { resetScroll } from "@/lib/scroll";

/**
 * Puts a new page at the top.
 *
 * Next resets the scroll position on a client-side navigation by itself, and with Lenis
 * running that reset does not stick — Lenis keeps its own target and animates the page
 * straight back to wherever the previous one was left. Reading to the bottom of Home and
 * clicking "About" landed at the bottom of About.
 *
 * **Skips the first render.** On a fresh load the browser is already restoring a
 * position — a deep link with a hash, or a reload part-way down — and overriding that
 * would break the back button and every anchor link on the site to fix a problem that
 * only exists on navigation.
 *
 * Renders nothing. `usePathname` is runtime data, so under Cache Components this has to
 * sit inside a Suspense boundary in the layout or the build fails — the same treatment
 * `SiteHeader` gets, and cheaper here because there is no markup to match in a fallback.
 */
export function ScrollReset() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    resetScroll();
  }, [pathname]);

  return null;
}
