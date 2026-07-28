import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Software City",
  description: "A career-visualisation engine: drag a timeline and a city rebuilds itself, skills as buildings and projects as roads. It ships from its own repository, reading the versioned career-graph contract this API exposes.",
};

export default function Page() {
  return (
    <ComingSoon
      title="Software City"
      phase="Separate project"
      summary="A career-visualisation engine: drag a timeline and a city rebuilds itself, skills as buildings and projects as roads. It ships from its own repository, reading the versioned career-graph contract this API exposes."
    />
  );
}
