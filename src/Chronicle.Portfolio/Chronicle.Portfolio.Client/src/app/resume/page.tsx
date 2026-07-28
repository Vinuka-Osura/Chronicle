import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Résumé",
  description: "An interactive résumé assembled from the same experience, skills and project data, plus a print-clean PDF.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Résumé"
      phase="Phase 3"
      summary="An interactive résumé assembled from the same experience, skills and project data, plus a print-clean PDF."
    />
  );
}
