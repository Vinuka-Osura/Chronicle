import {
  DockerMark,
  GitHub,
  MediumMark,
  MicrosoftMark,
  StackOverflowMark,
} from "@/components/Icon";

const SOURCES = {
  github: { label: "GitHub", Icon: GitHub, host: "github.com" },
  stackoverflow: { label: "Stack Overflow", Icon: StackOverflowMark, host: "stackoverflow.com" },
  docker: { label: "Docker Hub", Icon: DockerMark, host: "hub.docker.com" },
  medium: { label: "Medium", Icon: MediumMark, host: "medium.com" },
  credentials: { label: "Credly & Microsoft Learn", Icon: MicrosoftMark, host: null },
} as const;

export type SourceKey = keyof typeof SOURCES;

/**
 * Which service a section's numbers came from, said in the section's own header.
 *
 * **This exists because the page failed a basic test: a reader could not tell where any
 * figure came from.** Eight sections all wearing the same eyebrow label read as one
 * undifferentiated wall, and "reputation" means something very different depending on
 * whether it is Stack Overflow's or invented. Provenance is not decoration on a page whose
 * entire argument is that the numbers are real.
 *
 * The mark and the name are both present, never the mark alone. A logo is recognisable
 * only if you already know it, and the point is to inform the reader who does not.
 */
export function SourceTag({ source }: { source: SourceKey }) {
  const { label, Icon, host } = SOURCES[source];

  return (
    <p className="source-tag">
      <span className="source-tag-mark" aria-hidden>
        <Icon />
      </span>
      <span className="source-tag-label">{label}</span>
      {host && <span className="source-tag-host">{host}</span>}
    </p>
  );
}
