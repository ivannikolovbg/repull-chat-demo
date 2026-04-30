import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { RepullClient, repullTools } from '@repull/ai-sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Repull Chat Demo assistant.

You answer questions about a vacation-rental operator's data using the Repull API
via the @repull/ai-sdk tool bindings. The operator gave you read-only access to
their workspace (reservations, properties, Airbnb listings, health checks).

Rules:
- Always use a tool when the user asks about their data. Never invent reservation
  IDs, listing names, prices, or counts.
- When you list reservations, render them as a tight markdown table or list with
  the most useful fields: confirmation code, platform, check-in/out, status,
  total + currency, and the Repull reservation ID.
- Format dates as YYYY-MM-DD. Format money as "1,200 CAD" style.
- If a tool returns { ok: false, error }, explain what went wrong (auth, missing
  data, etc.) in plain language, do NOT retry blindly.
- If the user asks for something you cannot do read-only (e.g. "create a
  reservation", "cancel this booking"), say so clearly. The demo only exposes
  read tools.
- Keep responses concise. Two sentences of intro, then the data.`;

export async function POST(req: Request) {
  let payload: { messages?: UIMessage[]; apiKey?: string; sandbox?: boolean };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { messages = [], apiKey: userKey, sandbox } = payload;

  // Pick the Repull API key. Sandbox uses the server-side demo key.
  const repullKey = sandbox ? process.env.REPULL_DEMO_API_KEY : (userKey || '').trim();

  if (!repullKey) {
    return Response.json(
      {
        error:
          sandbox
            ? 'Sandbox mode is not configured on this deployment (REPULL_DEMO_API_KEY missing).'
            : 'Missing Repull API key. Paste a key in the top bar or enable Sandbox mode.',
      },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Server is missing ANTHROPIC_API_KEY.' },
      { status: 500 },
    );
  }

  const baseUrl = process.env.REPULL_API_BASE_URL || 'https://api.repull.dev';
  const client = new RepullClient({ apiKey: repullKey, baseUrl });

  // Read-only tool subset. createConnectSession is mutating — keep it out of
  // the demo so a stranger pasting a customer key (or hitting sandbox mode)
  // can't mint provider connect sessions on someone else's workspace.
  const allTools = repullTools(client);
  const tools = {
    listReservations: allTools.listReservations,
    getReservation: allTools.getReservation,
    listAirbnbListings: allTools.listAirbnbListings,
    listProperties: allTools.listProperties,
    healthCheck: allTools.healthCheck,
  };

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
    temperature: 0.2,
  });

  return result.toUIMessageStreamResponse();
}
