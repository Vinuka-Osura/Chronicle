import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Knowledge Core",
  description: "Technical write-ups plus a live view of what I am currently learning, with honest progress states.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Knowledge Core"
      phase="Phase 2"
      summary="Technical write-ups plus a live view of what I am currently learning, with honest progress states."
    />
  );
}
