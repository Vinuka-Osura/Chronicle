import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Profile } from "@/lib/types";

/**
 * The identity block, for the "Elsewhere" column.
 *
 * **Separate from `api.ts` on purpose.** That file holds the contact form's POST, which
 * `ContactForm` — a Client Component — imports. Anything in a module a Client Component
 * imports becomes client code, and `use cache` is server-only, so keeping this here is
 * what stops the whole page failing to compile.
 *
 * Read from the CMS rather than hardcoded, so a new social account is an edit and not a
 * deploy, and so the footer, the résumé and this page cannot disagree about which
 * accounts exist.
 */
export async function getProfile(): Promise<Profile | null> {
  "use cache";
  cacheTag("profile");
  cacheLife("hours");

  return requestOr<Profile | null>("/api/profile", null);
}
