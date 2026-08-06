import { apiUrl } from "@/lib/http";

/**
 * The bot's question, forwarded to the API from this server rather than from the browser.
 *
 * ── Why this exists at all ────────────────────────────────────────────────────────
 *
 * Every other call to the API is made by a Server Component, so it never leaves this
 * machine's trust. The bot asks from the BROWSER — the only request in the app that does
 * — and a browser calling the API directly has to clear two bars the server never did: a
 * cross-origin policy that has to name this exact deployment, and, in development, an
 * ASP.NET Core certificate it has no reason to trust. It failed on the second and would
 * have failed on the first in production.
 *
 * ── Why a route handler and not a rewrite ─────────────────────────────────────────
 *
 * A `next.config` rewrite was the first attempt and it returned a bare 307: the API
 * enforces HTTPS, and a rewrite proxies the request without following the redirect it
 * gets back. `fetch` follows redirects by default, which is precisely why every Server
 * Component has been fine with the same base URL all along.
 *
 * So this is nine lines that inherit the behaviour the rest of the app already relies on,
 * instead of a config entry that quietly does not.
 *
 * Only this one path is exposed. The rest of the API is not meant to be reachable from
 * this origin, and a catch-all proxy would publish it by accident.
 */
export async function GET(request: Request) {
  const incoming = new URL(request.url).searchParams;
  const query = new URLSearchParams({ q: incoming.get("q") ?? "" });

  // The thread's antecedent, carried by the client rather than held in server state.
  const context = incoming.get("context");
  if (context) query.set("context", context);

  const response = await fetch(`${apiUrl("/api/ask")}?${query}`, {
    headers: { accept: "application/json" },
    // The API output-caches this by query string for five minutes; caching it again here
    // would only add a second place for a stale answer to live.
    cache: "no-store",
  });

  // Pass the status through rather than flattening it. A 400 from the validator is a
  // message the caller can act on, and turning it into a 200 would hide that.
  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
