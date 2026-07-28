import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Experience, projects and future goals on one scrollable time axis, entered at today. Needs the merged /api/timeline endpoint.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Timeline"
      phase="Phase 2 - Signature #1"
      summary="Experience, projects and future goals on one scrollable time axis, entered at today. Needs the merged /api/timeline endpoint."
    />
  );
}
