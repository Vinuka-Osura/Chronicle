import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Skills",
  description: "Skills grouped by domain, each with years, a proficiency level, and links through to the projects and roles that actually used it - derived from the join tables, so it cannot disagree with the work.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Skills"
      phase="Phase 1"
      summary="Skills grouped by domain, each with years, a proficiency level, and links through to the projects and roles that actually used it - derived from the join tables, so it cannot disagree with the work."
    />
  );
}
