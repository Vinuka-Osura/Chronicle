import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Cache Components is the Next 16 caching model: data is dynamic by default and you
   * opt into caching per function or component with `use cache`. It also turns on
   * Partial Prerendering, which is exactly the shape this site wants - the content
   * pages are cached into a static shell while the Mission Control status strip
   * streams live at request time.
   *
   * It replaces the older ppr / useCache / dynamicIO flags as one setting.
   */
  cacheComponents: true,

  experimental: {
    /*
     * React's View Transitions integration, so navigating between routes cross-fades
     * rather than cutting.
     *
     * Experimental, and taken on deliberately: the entire feature degrades to nothing.
     * A browser without the View Transitions API navigates exactly as before, and
     * `prefers-reduced-motion` and Recruiter Mode both switch it off in `globals.css`.
     * There is no fallback path to maintain and no behaviour that depends on it, so the
     * cost of the flag changing under us is one line here.
     */
    viewTransition: true,
  },

  // Screenshots and diagrams are served from object storage, not committed to the repo.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.blob.core.windows.net" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },

  /*
   * The floating badge in the corner during `next dev`. It is Next's own dev tools -
   * route render mode, compile errors, preferences - and it is stripped from production
   * builds entirely, so visitors never see it.
   *
   * Left ON deliberately: it tells you at a glance whether a route is static or dynamic,
   * which is the thing most worth watching while Cache Components is enabled.
   *
   * Set `devIndicators: false` to hide it. Note that hiding it from the badge's own
   * panel writes a preference to localStorage, which this setting cannot override -
   * clear the site's local storage in devtools to bring it back.
   */
  devIndicators: {
    position: "bottom-right",
  },

  // The API owns its own error contract; never leak framework internals to visitors.
  poweredByHeader: false,
};

export default nextConfig;
