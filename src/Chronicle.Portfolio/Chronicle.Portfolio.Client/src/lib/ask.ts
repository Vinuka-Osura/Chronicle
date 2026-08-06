import type { AskAnswer } from "@/lib/types";

/**
 * Ask a question of the site.
 *
 * In `lib` rather than beside a feature because the bot is mounted in the root layout —
 * it belongs to every page and to none of them, like the header and the status strip.
 *
 * Runs in the browser: the question comes from a keystroke, so there is nothing for a
 * Server Component to cache. The caching that matters is on the API, which output-caches
 * by query string — the same question from a hundred visitors is one database read.
 *
 * **Same-origin, via a rewrite, not `apiUrl`.** This is the only browser-side call to the
 * API in the app, and calling it directly means clearing a cross-origin policy that has to
 * name the deployment and — in development — a certificate the browser has no reason to
 * trust. It failed on the second and would have failed on the first in production. The
 * rewrite in `next.config.ts` makes both go away.
 *
 * Failure degrades to an answer rather than an exception. A chat panel that throws leaves
 * the reader looking at their own question with nothing under it, and "I could not reach
 * the content service" is itself a usable reply.
 */
export async function ask(
  question: string,
  context: string | null,
  signal?: AbortSignal,
): Promise<AskAnswer> {
  try {
    const query = new URLSearchParams({ q: question });
    if (context) query.set("context", context);

    const response = await fetch(`/api/ask?${query}`, {
      signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) throw new Error(String(response.status));

    return (await response.json()) as AskAnswer;
  } catch (error) {
    // An abort is the reader asking something else, not a failure. Rethrow so the caller
    // can drop that turn rather than rendering an error for their own keystroke.
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    return {
      question,
      answer:
        "I could not reach the content service just then, sorry. Everything I would have "
        + "said is on the pages themselves.",
      sources: [
        { label: "About", path: "/about" },
        { label: "Projects", path: "/projects" },
      ],
      suggestions: [],
      matched: "error",
      subject: null,
    };
  }
}
