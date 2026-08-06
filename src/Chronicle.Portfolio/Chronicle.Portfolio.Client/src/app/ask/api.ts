import { apiUrl } from "@/lib/http";
import type { AskAnswer } from "@/lib/types";

/**
 * Ask a question of the site.
 *
 * Not `use cache`, and not a Server Component fetch: the question comes from a keystroke
 * in the browser, so this runs there. The API output-caches by query string for five
 * minutes, which is where the caching that matters happens — the same question from a
 * hundred visitors is one database read.
 *
 * Failure degrades to an answer rather than an exception. A chat box that throws leaves
 * the reader looking at their own question with nothing under it, and "the service is
 * unavailable" is itself a usable answer.
 */
export async function ask(question: string, signal?: AbortSignal): Promise<AskAnswer> {
  try {
    const response = await fetch(`${apiUrl("/api/ask")}?q=${encodeURIComponent(question)}`, {
      signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) throw new Error(String(response.status));

    return (await response.json()) as AskAnswer;
  } catch (error) {
    // An aborted request is the reader typing again, not a failure. Rethrow so the
    // caller can drop it silently instead of rendering an error for their own keystroke.
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    return {
      question,
      answer:
        "That could not be looked up just now — the content service did not answer. "
        + "Everything it would have said is on the pages themselves.",
      sources: [
        { label: "About", path: "/about" },
        { label: "Projects", path: "/projects" },
      ],
      suggestions: [],
      matched: "error",
    };
  }
}
