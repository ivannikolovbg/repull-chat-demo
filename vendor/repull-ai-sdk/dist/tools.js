import { tool } from 'ai';
import { z } from 'zod';
import { RepullApiError } from './client.js';
function toErrorResult(err) {
    if (err instanceof RepullApiError) {
        return {
            ok: false,
            error: { status: err.status, message: err.message, body: err.body },
        };
    }
    if (err instanceof Error) {
        return { ok: false, error: { status: null, message: err.message } };
    }
    return { ok: false, error: { status: null, message: String(err) } };
}
/* ─────────────────────────── input schemas ─────────────────────────── */
const ListReservationsInput = z.object({
    platform: z
        .enum(['airbnb', 'booking', 'vrbo', 'plumguide', 'website', 'direct'])
        .optional()
        .describe('Filter by booking platform.'),
    status: z
        .enum(['pending', 'confirmed', 'cancelled', 'completed'])
        .optional()
        .describe('Filter by reservation status.'),
    checkInFrom: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use ISO date YYYY-MM-DD.')
        .optional()
        .describe('Earliest check-in date (inclusive), ISO YYYY-MM-DD.'),
    checkInTo: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use ISO date YYYY-MM-DD.')
        .optional()
        .describe('Latest check-in date (inclusive), ISO YYYY-MM-DD.'),
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max results per page (1-100). The API caps at 100.'),
    cursor: z.string().optional().describe('Pagination cursor returned by the previous call.'),
});
const GetReservationInput = z.object({
    id: z.number().int().positive().describe('Repull reservation ID.'),
});
const ListAirbnbListingsInput = z.object({
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max results per page (1-100).'),
    cursor: z.string().optional().describe('Pagination cursor returned by the previous call.'),
});
const ListPropertiesInput = z.object({
    provider: z
        .string()
        .optional()
        .describe('Filter by PMS provider slug (e.g. "hostaway", "guesty", "airbnb").'),
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max results per page (1-100).'),
    cursor: z.string().optional().describe('Pagination cursor returned by the previous call.'),
});
const HealthCheckInput = z.object({}).describe('No input — returns API health status.');
const CreateConnectSessionInput = z.object({
    provider: z
        .string()
        .min(1)
        .describe('Provider slug, e.g. "airbnb", "booking", "vrbo", "plumguide", "hostaway", "guesty".'),
    redirectUrl: z
        .string()
        .url()
        .optional()
        .describe('Airbnb only — where to redirect the user after the OAuth flow completes.'),
    accessType: z
        .enum(['read_only', 'full_access'])
        .optional()
        .describe("Airbnb only — 'read_only' grants calendar-only access, 'full_access' grants full host scopes (default)."),
    apiKey: z
        .string()
        .optional()
        .describe('PMS providers — provider-side API key when connecting via direct credentials.'),
    clientId: z.string().optional().describe('Plumguide — client ID.'),
    clientSecret: z.string().optional().describe('Plumguide — client secret.'),
});
/* ─────────────────────────── tool factory ─────────────────────────── */
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
export function repullTools(client) {
    return {
        listReservations: tool({
            description: 'List reservations across all connected channels. Supports filtering by platform, ' +
                'status, and check-in date range. Returns a paginated list — pass `cursor` from a ' +
                'previous response to fetch the next page. Read-only.',
            inputSchema: ListReservationsInput,
            execute: async (input) => {
                try {
                    const data = await client.request('GET', '/v1/reservations', {
                        query: input,
                    });
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
        getReservation: tool({
            description: 'Fetch a single reservation by its Repull ID. Returns the full reservation record ' +
                'including guest info, dates, pricing, and channel-specific metadata. Read-only.',
            inputSchema: GetReservationInput,
            execute: async (input) => {
                try {
                    const data = await client.request('GET', `/v1/reservations/${encodeURIComponent(String(input.id))}`);
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
        listAirbnbListings: tool({
            description: 'List Airbnb listings on the connected Airbnb account. Returns title, status, ' +
                'pricing summary, and Airbnb listing IDs. Read-only.',
            inputSchema: ListAirbnbListingsInput,
            execute: async (input) => {
                try {
                    const data = await client.request('GET', '/v1/channels/airbnb/listings', {
                        query: input,
                    });
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
        listProperties: tool({
            description: 'List properties (units / listings) under management across all connected PMS and ' +
                'OTA providers. Optionally filter by `provider` slug. Read-only.',
            inputSchema: ListPropertiesInput,
            execute: async (input) => {
                try {
                    const data = await client.request('GET', '/v1/properties', {
                        query: input,
                    });
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
        healthCheck: tool({
            description: 'Check the Repull API health. Returns `{ status: "ok" }` (or details on degraded ' +
                'subsystems) when the platform is reachable. Use this to verify the API key works.',
            inputSchema: HealthCheckInput,
            execute: async () => {
                try {
                    const data = await client.request('GET', '/v1/health');
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
        createConnectSession: tool({
            description: 'Initiate a Repull Connect session for a provider. For Airbnb this returns an OAuth ' +
                'authorization URL the user must visit; for PMS providers (e.g. Hostaway, Guesty) ' +
                'this exchanges supplied credentials for an active connection. This is the ONLY ' +
                'mutating tool in this set — it creates a new provider connection on the workspace.',
            inputSchema: CreateConnectSessionInput,
            execute: async (input) => {
                try {
                    const { provider, ...body } = input;
                    const data = await client.request('POST', `/v1/connect/${encodeURIComponent(provider)}`, { body });
                    return { ok: true, data };
                }
                catch (err) {
                    return toErrorResult(err);
                }
            },
        }),
    };
}
//# sourceMappingURL=tools.js.map