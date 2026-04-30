import { type Tool } from 'ai';
import { type RepullClient } from './client.js';
/**
 * Shape of every tool result. Successful calls return `{ ok: true, data }`,
 * failures return `{ ok: false, error }` with the API status code and body
 * surfaced to the model so it can recover.
 *
 * Returning structured errors instead of throwing lets the AI agent pick
 * a recovery path on its own (apologize, retry, ask the user) instead of
 * hard-aborting the streaming response.
 */
export type RepullToolResult<T> = {
    ok: true;
    data: T;
} | {
    ok: false;
    error: {
        status: number | null;
        message: string;
        body?: unknown;
    };
};
/**
 * Build a record of Vercel-AI-SDK-compatible tools backed by a {@link RepullClient}.
 *
 * Drop the result straight into `streamText({ tools: repullTools(client) })`
 * or any other AI SDK call site that accepts a `ToolSet`.
 *
 * The returned object is plain — you can `omit` / extend it freely:
 * ```ts
 * const tools = repullTools(client);
 * const readonlyTools = { listReservations: tools.listReservations };
 * ```
 *
 * @param client a configured {@link RepullClient}
 * @returns map of tool name → AI SDK Tool definition
 */
export declare function repullTools(client: RepullClient): {
    listReservations: Tool;
    getReservation: Tool;
    listAirbnbListings: Tool;
    listProperties: Tool;
    healthCheck: Tool;
    createConnectSession: Tool;
};
/** Names of all tools returned by {@link repullTools}. */
export type RepullToolName = keyof ReturnType<typeof repullTools>;
//# sourceMappingURL=tools.d.ts.map