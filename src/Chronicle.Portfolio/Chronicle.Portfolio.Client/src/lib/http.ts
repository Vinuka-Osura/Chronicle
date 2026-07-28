/**
 * The shared HTTP layer. Every feature's `api.ts` goes through this.
 *
 * The one place the API base URL is read, so no feature hardcodes a host or a port.
 * In development the Aspire AppHost injects NEXT_PUBLIC_API_BASE_URL with the address
 * it assigned the server.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

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
