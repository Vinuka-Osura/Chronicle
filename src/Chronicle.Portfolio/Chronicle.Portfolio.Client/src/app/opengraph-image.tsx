import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Sam Iversen — Software Engineer";

/**
 * The card that appears when a link to this site is pasted into Slack, LinkedIn or a
 * message. Generated rather than a checked-in PNG, so it cannot drift from the site's
 * palette and there is no binary in the repository to keep in step.
 *
 * Deliberately not Tailwind: `next/og` renders through Satori, which supports a subset
 * of CSS and no stylesheet at all. Every value here is inline, and the tokens are
 * repeated from `globals.css` because Satori cannot read custom properties.
 */
/*
 * Rendered on demand, and that is fine. `use cache` is not valid inside a metadata
 * route entry, and the alternative - a checked-in PNG - is a binary that drifts from the
 * palette the moment either changes. This route is reached only by a crawler unfurling a
 * shared link, once, and those cache the result themselves; it is nowhere near a
 * visitor's critical path.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0f16",
          color: "#e8edf3",
          padding: "72px 80px",
          // Satori has no default font stack; naming one keeps it from falling back to
          // something that renders differently on the machine that builds this.
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#e0973f",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#9aa8b8",
            }}
          >
            Chronicle
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 600, lineHeight: 1.05 }}>
            Sam Iversen
          </div>
          <div style={{ fontSize: 34, color: "#9aa8b8", lineHeight: 1.3 }}>
            Software engineer — payments systems and reliability
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #232c38",
            paddingTop: 28,
            fontSize: 24,
            color: "#6f7d8f",
          }}
        >
          <div style={{ display: "flex" }}>Case studies · Timeline · Analytics</div>
          <div style={{ display: "flex", color: "#e0973f" }}>github.com/Vinuka-Osura</div>
        </div>
      </div>
    ),
    size,
  );
}
