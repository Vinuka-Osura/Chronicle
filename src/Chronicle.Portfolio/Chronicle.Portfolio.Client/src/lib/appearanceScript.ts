/*
  NO "use client" DIRECTIVE, AND THAT IS THE ENTIRE POINT OF THIS FILE.

  This script used to live in `appearance.tsx`, which is a client module. A server
  component importing a plain value from a "use client" module does not get the value —
  the bundler replaces it with a client *reference*, and rendering that reference into
  the HTML produced this, verbatim, at the top of every page:

      <script>function(){throw Error("Attempted to call appearanceScript() from the
      server but appearanceScript is on the client...")}</script>

  A stub that throws, in place of the script. Silently, with no build error, because as
  far as the bundler is concerned it did exactly what it was asked. So every full page
  load ignored the saved theme, ignored Recruiter Mode, and left `data-motion` unset —
  which in turn switched off the inertial scroll and every effect gated on the `full`
  tier. The site looked like it had almost no motion in it, because it had almost none.

  Keeping the string in a module with no directive is what makes it a string on both
  sides. `appearance.tsx` imports from here rather than the other way round.
*/

export const THEME_COOKIE = "theme";
export const RECRUITER_COOKIE = "recruiterMode";

export type Theme = "light" | "dark";

/**
 * Motion tiers, decided once before first paint.
 *
 * `full` gets everything. `reduced` keeps scroll and reveals but coarsens the water and
 * drops backdrop blur. `still` moves nothing at all.
 *
 * **This is what allows the default to be greedy.** Recruiter Mode is opt-in, so a
 * visitor on a weak phone who never finds the toggle would otherwise just get a bad
 * site. Deciding here — pre-paint, from what the device reports about itself — means the
 * rich version can be uncompromising because it is not the only version.
 */
export type MotionTier = "full" | "reduced" | "still";

/**
 * Applies the motion tier from the two things that can override it.
 *
 * The device tier is expensive to work out and never changes, so the pre-paint script
 * computes it once and parks it on `data-motion-base`. Everything after that is just
 * this: Recruiter Mode or `prefers-reduced-motion` force `still`, and turning them off
 * restores whatever the device was judged capable of.
 *
 * **Recruiter Mode used to change `data-recruiter` and nothing else**, so the water, the
 * inertial scroll and every tier-gated rule carried on running until the page was
 * reloaded — it looked half-applied, because it was. Reading the base rather than
 * recomputing it here is what stops this and the pre-paint script drifting apart.
 */
export function applyMotionTier(): MotionTier {
  const root = document.documentElement;
  const quiet =
    root.dataset.recruiter === "on" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const tier: MotionTier = quiet
    ? "still"
    : ((root.dataset.motionBase as MotionTier | undefined) ?? "full");

  root.dataset.motion = tier;
  return tier;
}

/**
 * Runs before first paint, as the first child of `<body>`.
 *
 * One script stamps all three appearance attributes, deliberately. They are the same
 * problem three times — a preference that must be correct on the very first frame or the
 * user watches the page change under them — and separate blocking scripts would be
 * separate chances to flash.
 *
 * Reading the cookies during SSR would be the obvious alternative, but under Cache
 * Components calling `cookies()` in a layout drags every page out of the static shell
 * and forces request-time rendering site-wide. This keeps the pages prerenderable AND
 * flash-free.
 *
 * Theme falls back to the OS preference when no cookie is set, so a first-time visitor
 * gets what their system already asked for rather than an arbitrary default.
 *
 * Device hints — `deviceMemory`, `hardwareConcurrency`, Save-Data, effective connection
 * type — are hints rather than truth, so the thresholds are generous: the cost of
 * over-delivering to a capable phone is a dropped frame, and the cost of
 * under-delivering is a site that looks broken.
 */
/*
  NOTE THE DOUBLE BACKSLASH in the cookie patterns below.

  This is a template literal, so `\s` is not a regex escape here — JavaScript reads it as
  an unrecognised string escape and emits a bare `s`. The shipped pattern was
  `(?:^|;s*)recruiterMode=`, which matches a cookie only when it is FIRST in the header,
  because every later one is preceded by "; " and there is no `\s` left to match the
  space. Theme worked by luck of ordering; Recruiter Mode did not.
*/
export const appearanceScript = `(function(){try{var d=document.documentElement,c=document.cookie;var t=c.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);var m=t&&t[1];if(m!=="dark"&&m!=="light"){m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=m;d.style.colorScheme=m;var r=c.match(/(?:^|;\\s*)${RECRUITER_COOKIE}=([^;]*)/);var rm=r&&r[1]==="1";d.dataset.recruiter=rm?"on":"off";var n=navigator,cn=n.connection||{},tier="full";if(n.deviceMemory&&n.deviceMemory<4)tier="reduced";if(n.hardwareConcurrency&&n.hardwareConcurrency<=4)tier="reduced";if(cn.saveData)tier="reduced";if(cn.effectiveType&&/^(slow-)?2g$|^3g$/.test(cn.effectiveType))tier="reduced";d.dataset.motionBase=tier;if(rm||(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches))tier="still";d.dataset.motion=tier}catch(e){var f=document.documentElement.dataset;f.theme="light";f.recruiter="off";f.motionBase="still";f.motion="still"}})();`;
