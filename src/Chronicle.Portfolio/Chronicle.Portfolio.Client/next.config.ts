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

  // Screenshots and diagrams are served from object storage, not committed to the repo.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.blob.core.windows.net" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },

  // The API owns its own error contract; never leak framework internals to visitors.
  poweredByHeader: false,
};

export default nextConfig;
