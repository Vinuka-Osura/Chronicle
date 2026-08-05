"use client";

import { useSyncExternalStore } from "react";
import type { TimelineItemType } from "@/lib/types";
import { ALL_LENSES, parseLenses } from "./lenses";

/*
  Which kinds are showing, read from `<html data-lens>`.

  Extracted so the context bar and the transport share one subscription rather than each
  keeping its own copy. The bar's own comment already says why the attribute is the source
  of truth — the pre-paint script sets it before the first frame so CSS can filter without
  a flash, and a React mirror would be a second truth that can disagree.

  **`getServerSnapshot` returns every lens on purpose.** The server cannot see the cookie
  or the URL, and rendering nothing until hydration would mean the transport draws an empty
  chart in the HTML and pops into existence afterwards. All-lenses is both the documented
  default and the correct fallback for a reader with no JavaScript.

  It lives in its own module rather than in `lenses.ts` because that file is imported by
  the root layout — a server component — for `lensScript`, and it must stay free of both a
  `"use client"` directive and any React import.
*/
export function useActiveLenses(): TimelineItemType[] {
  const raw = useSyncExternalStore(subscribe, read, readOnServer);
  return parseLenses(raw);
}

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-lens"],
  });
  return () => observer.disconnect();
}

const read = () => document.documentElement.dataset.lens ?? ALL_LENSES.join(" ");
const readOnServer = () => ALL_LENSES.join(" ");
