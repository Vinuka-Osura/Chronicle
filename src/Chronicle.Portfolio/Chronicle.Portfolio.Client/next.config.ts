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
   * Uploaded media, proxied to the API.
   *
   * The local-disk storage provider stores a RELATIVE url — `/media/<key>` — and the API
   * serves those files itself. That works when the API is the origin. It is not: the
   * public site is this Next app on its own port, so `<img src="/media/x.png">` asked
   * Next for a file only the API has, and every uploaded screenshot 404'd on the public
   * pages while looking perfectly fine in the CMS preview.
   *
   * A rewrite rather than absolute URLs in the database, because the host is deployment
   * configuration and the database should not have to be rewritten when it changes. The
   * R2 provider already stores absolute URLs and is unaffected — this only ever matches
   * the local provider's paths.
   */
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

    /*
     * The bot's endpoint is deliberately NOT here. A rewrite proxies the request but does
     * not follow what comes back, and the API enforces HTTPS — so a rewrite to it returned
     * a bare 307 with no body. It is a route handler instead, at `app/api/ask/route.ts`,
     * where `fetch` follows the redirect the way every Server Component already does.
     */
    return [{ source: "/media/:path*", destination: `${api}/media/:path*` }];
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
    // Bottom-LEFT since the bot took the other corner. Two round badges an inch apart is
    // a developer clicking the wrong one, and this is the one that only exists in dev.
    position: "bottom-left",
  },

  // The API owns its own error contract; never leak framework internals to visitors.
  poweredByHeader: false,
};

export default nextConfig;
