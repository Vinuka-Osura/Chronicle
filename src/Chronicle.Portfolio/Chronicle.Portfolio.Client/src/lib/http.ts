/**
 * The shared HTTP layer. Every feature's `api.ts` goes through this.
 *
 * The one place the API base URL is read, so no feature hardcodes a host or a port.
 * In development the Aspire AppHost injects NEXT_PUBLIC_API_BASE_URL with the address
 * it assigned the server.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

/**
 * The absolute URL of an API path, for the few links the browser follows itself.
 *
 * `request` builds its own; this is for an `<a href>` or a `<form action>`, where the
 * browser needs the whole address and the fetch layer is not involved at all. The
 * variable is `NEXT_PUBLIC_`, so the value is inlined at build time and works from a
 * client component.
 */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`GET ${path} responded ${status}`);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(path, response.status);
  }

  return (await response.json()) as T;
}

/**
 * Content fetchers degrade to an empty result instead of throwing.
 *
 * The alternative is that `next build` fails whenever the API is unreachable — which is
 * the normal case in CI, where the frontend is built without a database behind it. A
 * page rendering its empty state is a better failure than a build that cannot run, and
 * the warning still names what broke.
 */
export async function requestOr<T>(path: string, fallback: T): Promise<T> {
  try {
    return await request<T>(path);
  } catch (error) {
    console.warn(
      `[chronicle] ${path} unavailable, rendering empty state.`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

/**
 * A ProblemDetails failure, unpacked. `errors` is present on a 400 from
 * `ValidationBehaviour`, keyed by property name.
 */
export type ProblemResult =
  | { ok: true }
  | { ok: false; status: number; detail?: string; errors?: Record<string, string[]> };

/**
 * The one write the public site makes.
 *
 * Failure is returned rather than thrown, because for a write every failure needs its
 * own message — a rate limit, a validation error and an unconfigured mailer are three
 * different things to tell someone, and a caught exception flattens them into one.
 * A network error surfaces as status 0, which no server can return.
 */
export async function post(path: string, body: unknown): Promise<ProblemResult> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0 };
  }

  if (response.ok) {
    return { ok: true };
  }

  // A rate limiter rejects before the endpoint runs, so 429 has no ProblemDetails body.
  const problem = await response.json().catch(() => null);

  return {
    ok: false,
    status: response.status,
    detail: typeof problem?.detail === "string" ? problem.detail : undefined,
    errors: problem?.errors ?? undefined,
  };
}

/** Builds a query string, omitting anything undefined. Returns "" when there is nothing to add. */
export function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  return search.size > 0 ? `?${search}` : "";
}
