import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "About",
  description: "The story, what I care about building, and the certifications that back it up. Served from the CMS once the About and Certifications slices ship.",
};

export default function Page() {
  return (
    <ComingSoon
      title="About"
      phase="Phase 1"
      summary="The story, what I care about building, and the certifications that back it up. Served from the CMS once the About and Certifications slices ship."
    />
  );
}
