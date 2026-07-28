import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Contact",
  description: "A spam-protected form that posts to the API and sends an email. Direct links in the footer work today.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Contact"
      phase="Phase 1"
      summary="A spam-protected form that posts to the API and sends an email. Direct links in the footer work today."
    />
  );
}
