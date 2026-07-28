import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Ask",
  description: "A retrieval-grounded assistant that answers questions about this work and cites the page it drew from. Deliberately last, and built on a free model.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Ask"
      phase="Phase 3 - Signature #3"
      summary="A retrieval-grounded assistant that answers questions about this work and cites the page it drew from. Deliberately last, and built on a free model."
    />
  );
}
