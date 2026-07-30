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
