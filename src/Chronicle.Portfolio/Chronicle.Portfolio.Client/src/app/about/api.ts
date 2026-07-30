import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Certification } from "@/lib/types";

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheTag("certifications");
  cacheLife("hours");

  return requestOr<Certification[]>("/api/certifications", []);
}
