/**
 * A very small architecture-diagram language, and its layout.
 *
 * The operator writes what talks to what, one edge per line:
 *
 *   Browser -> API : HTTPS
 *   API -> Database : SQL
 *   API -> Cache
 *   Worker -> Database : nightly
 *
 * and gets a laid-out, animated SVG. No coordinates, no drag-and-drop editor, no
 * uploaded PNG that goes stale the moment the architecture changes and cannot be
 * themed, searched or read by a screen reader.
 *
 * The whole grammar is `A -> B` with an optional `: label`, because every extra piece of
 * syntax is something the operator has to remember at 11pm to describe a system they
 * already understand. Anything this cannot express is a job for prose, which the case
 * study already has.
 */

export interface DiagramNode {
  id: string;
  label: string;
  /** Column index, derived from how far the node sits from an entry point. */
  depth: number;
  x: number;
  y: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  /** Order in which this edge animates. Follows the reading order of the source. */
  step: number;
}

export interface Diagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  width: number;
  height: number;
}

const NODE_WIDTH = 132;
const NODE_HEIGHT = 46;
const COLUMN_GAP = 96;
const ROW_GAP = 30;
const PADDING = 8;

/** Returns null when the source describes nothing renderable, so callers can fall back. */
export function parseDiagram(source: string | null | undefined): Diagram | null {
  if (!source?.trim()) {
    return null;
  }

  const edges: { from: string; to: string; label?: string }[] = [];
  const order: string[] = [];

  const see = (name: string) => {
    if (!order.includes(name)) order.push(name);
  };

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    // Blank lines space the source out; # lets the operator annotate it.
    if (!line || line.startsWith("#")) continue;

    const [connection, ...labelParts] = line.split(":");
    const [from, to] = connection.split("->").map((part) => part.trim());

    // A malformed line is skipped rather than throwing. A diagram that renders three of
    // its four edges is far more use than a case study that fails to load.
    if (!from || !to) continue;

    see(from);
    see(to);
    edges.push({
      from,
      to,
      label: labelParts.join(":").trim() || undefined,
    });
  }

  if (order.length === 0) {
    return null;
  }

  const depths = assignDepths(order, edges);
  const nodes = layOut(order, depths);

  return {
    nodes,
    edges: edges.map((edge, step) => ({ ...edge, step })),
    width: Math.max(...nodes.map((node) => node.x + NODE_WIDTH)) + PADDING,
    height: Math.max(...nodes.map((node) => node.y + NODE_HEIGHT)) + PADDING,
  };
}

/**
 * Depth = longest path from any entry point, so a node always sits to the right of
 * everything that calls it.
 *
 * Longest rather than shortest deliberately: with both `API -> Database` and
 * `API -> Cache -> Database`, shortest-path would put Database beside Cache and draw an
 * edge backwards through the diagram. Longest-path puts it after both.
 *
 * Iterative with a bounded pass count rather than a topological sort, because a cycle is
 * a perfectly reasonable thing to describe — a worker writing to the database that feeds
 * it — and a topological sort has no answer for one.
 */
function assignDepths(
  order: string[],
  edges: { from: string; to: string }[],
): Map<string, number> {
  const depth = new Map(order.map((id) => [id, 0]));

  for (let pass = 0; pass < order.length; pass++) {
    let moved = false;

    for (const edge of edges) {
      const next = depth.get(edge.from)! + 1;
      if (next > depth.get(edge.to)!) {
        depth.set(edge.to, next);
        moved = true;
      }
    }

    // Settled, or we have run as many passes as there are nodes — which is the point at
    // which a cycle would otherwise push depths up for ever.
    if (!moved) break;
  }

  return depth;
}

function layOut(order: string[], depths: Map<string, number>): DiagramNode[] {
  const columns = new Map<number, string[]>();

  // Column membership follows declaration order, so the diagram reads in the order it
  // was written rather than in whatever order a Map happens to iterate.
  for (const id of order) {
    const depth = depths.get(id)!;
    const column = columns.get(depth) ?? [];
    column.push(id);
    columns.set(depth, column);
  }

  const tallest = Math.max(...[...columns.values()].map((c) => c.length));
  const height = tallest * NODE_HEIGHT + (tallest - 1) * ROW_GAP;

  const nodes: DiagramNode[] = [];

  for (const [depth, ids] of columns) {
    const columnHeight = ids.length * NODE_HEIGHT + (ids.length - 1) * ROW_GAP;
    // Each column is centred against the tallest, so a two-node column sits opposite the
    // middle of a four-node one instead of hanging off the top.
    const top = PADDING + (height - columnHeight) / 2;

    ids.forEach((id, row) => {
      nodes.push({
        id,
        label: id,
        depth,
        x: PADDING + depth * (NODE_WIDTH + COLUMN_GAP),
        y: top + row * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  return nodes;
}

export const DIAGRAM_GEOMETRY = {
  NODE_WIDTH,
  NODE_HEIGHT,
} as const;
