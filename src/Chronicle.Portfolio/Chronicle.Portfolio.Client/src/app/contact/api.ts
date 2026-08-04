/*
  The WRITE half only. The server-only read lives in `profile.ts`.

  They are split because `ContactForm` is a Client Component and imports this file, which
  makes the whole module a Client Component too — and `use cache`, `cacheTag` and
  `cacheLife` are server-only. Putting the two in one file compiles, type-checks and lints
  clean, then fails at render with "not allowed to define inline use cache annotated
  functions in Client Components". Only `next build`/dev catches it, which is exactly why
  it is worth a comment.
*/
import { post, type ProblemResult } from "@/lib/http";

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
  /** Honeypot. Always sent, always expected to be empty — the API rejects anything else. */
  website: string;
}

/**
 * No `use cache` here, unlike every other feature's api.ts: this is a write, it runs in
 * the browser, and caching a POST would be a bug rather than an optimisation.
 */
export function sendContactMessage(message: ContactMessage): Promise<ProblemResult> {
  return post("/api/contact", message);
}
