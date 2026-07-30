import type { TimelineItemType } from "@/lib/types";

export const LENS_COOKIE = "timelineLens";

/**
 * The five lenses, one per node type.
 *
 * Lens key IS the node type, deliberately — no mapping table to keep in step, and the
 * CSS rules that hide filtered nodes can be written mechanically.
 *
 * The glyph is the same one the node renders, which is what lets the chips double as
 * the page's legend instead of needing a separate key nobody reads.
 */
export const LENSES: readonly {
  key: TimelineItemType;
  label: string;
  glyph: string;
  description: string;
}[] = [
  { key: "experience", label: "Roles", glyph: "●", description: "periods of employment" },
  { key: "project", label: "Projects", glyph: "■", description: "case studies" },
  { key: "milestone", label: "Life", glyph: "▲", description: "education and personal milestones" },
  { key: "certification", label: "Certifications", glyph: "◆", description: "credentials" },
  { key: "roadmap", label: "Goals", glyph: "○", description: "stated intentions, not achievements" },
];

export const ALL_LENSES = LENSES.map((l) => l.key);

/** Normalises any input to a valid, non-empty lens set. */
export function parseLenses(raw: string | null | undefined): TimelineItemType[] {
  if (!raw) return [...ALL_LENSES];

  const wanted = raw.split(/[\s,]+/).filter(Boolean);
  const valid = ALL_LENSES.filter((key) => wanted.includes(key));

  // An empty set would render a blank page and look broken rather than filtered.
  return valid.length > 0 ? valid : [...ALL_LENSES];
}

/**
 * Runs before first paint, appended to the appearance script.
 *
 * Stamps `data-lens` on <html> so CSS can hide filtered node types on the very first
 * frame — a returning visitor with a narrow lens never sees the full timeline flash
 * past. It also means the filter works with JavaScript disabled entirely.
 *
 * The URL wins over the cookie, so a shared link shows what the sender saw.
 */
export const lensScript = `(function(){try{var d=document.documentElement;var all="${ALL_LENSES.join(" ")}";var q=new URLSearchParams(location.search).get("lens");var c=document.cookie.match(/(?:^|;\\s*)${LENS_COOKIE}=([^;]*)/);var raw=q||(c&&decodeURIComponent(c[1]))||all;var valid=all.split(" ").filter(function(k){return raw.split(/[\\s,]+/).indexOf(k)>=0});d.dataset.lens=valid.length?valid.join(" "):all}catch(e){document.documentElement.dataset.lens="${ALL_LENSES.join(" ")}"}})();`;
