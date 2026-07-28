import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Engineering Analytics",
  description: "Real commit activity, languages and streak, pulled from the GitHub API and cached server-side so the page never blocks on a third party.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Engineering Analytics"
      phase="Phase 2"
      summary="Real commit activity, languages and streak, pulled from the GitHub API and cached server-side so the page never blocks on a third party."
    />
  );
}
