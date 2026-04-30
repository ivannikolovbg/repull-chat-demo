import createClient from 'openapi-fetch';
/**
 * Options for constructing a {@link RepullClient}.
 */
export interface RepullClientOptions {
    /** Repull API key (https://repull.dev/dashboard). */
    apiKey: string;
    /** Override the API base URL. Defaults to `https://api.repull.dev`. */
    baseUrl?: string;
    /**
     * Custom fetch implementation. Defaults to the global `fetch`.
     * Useful for retries, logging, or running under non-standard runtimes.
     */
    fetch?: typeof fetch;
    /** Optional extra headers merged onto every request. */
    headers?: Record<string, string>;
    /** Per-request timeout in milliseconds. Defaults to 30s. */
    timeoutMs?: number;
}
/**
 * Thin typed client over `api.repull.dev`. Used by {@link repullTools} and
 * exposed so callers can swap in custom fetch / base URL / headers.
 *
 * The client itself is intentionally unopinionated — it does NOT add retries,
 * caching, or rate-limit handling. Wrap it externally (e.g. in `executeWithBackoff`)
 * if you need those behaviors.
 */
export declare class RepullClient {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly timeoutMs: number;
    private readonly extraHeaders;
    private readonly customFetch?;
    /**
     * `openapi-fetch` typed-ish client. We don't ship the generated types in
     * this thin package, so we accept `any` here and rely on Zod schemas at
     * the tool boundary for validation.
     */
    readonly raw: ReturnType<typeof createClient<any>>;
    constructor(opts: RepullClientOptions);
    /**
     * Generic request helper used by tool `execute` functions. Returns
     * the parsed JSON body on success, throws a {@link RepullApiError}
     * on non-2xx responses.
     */
    request<T = unknown>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, init?: {
        query?: Record<string, unknown>;
        body?: unknown;
        signal?: AbortSignal;
    }): Promise<T>;
}
/**
 * Error thrown by {@link RepullClient.request} on non-2xx responses.
 * Tool `execute` functions catch this and surface a structured error
 * shape to the model, so it can recover (or apologize) gracefully.
 */
export declare class RepullApiError extends Error {
    readonly status: number;
    readonly body: unknown;
    readonly name = "RepullApiError";
    constructor(status: number, body: unknown, message: string);
}
//# sourceMappingURL=client.d.ts.map