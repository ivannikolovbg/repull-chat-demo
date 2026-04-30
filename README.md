# Repull Chat Demo

Live chat UI demo for the [`@repull/ai-sdk`](https://github.com/ivannikolovbg/repull-ai-sdk).
Paste your Repull API key, ask Claude about your data — the model calls
`api.repull.dev` directly via the SDK's tool bindings.

## Try it

[**repull-chat-demo.vercel.app**](https://repull-chat-demo.vercel.app)

1. Get a key at <https://repull.dev/dashboard>.
2. Paste it into the top bar.
3. Ask things like:
   - *List my last 10 reservations*
   - *What Airbnb listings do I have?*
   - *Check my account health*
4. No key? Flip the **Sandbox** toggle for a read-only demo workspace.

The key never leaves the request lifecycle — it's sent to `/api/chat` per
message and used to construct an in-memory `RepullClient`. We don't persist
it server-side.

## Stack

- Next.js 15 (App Router) + Turbopack
- Vercel AI SDK 5 (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/react`)
- LLM: **Claude Sonnet 4.6** (Anthropic)
- Tool layer: vendored `@repull/ai-sdk` (read-only subset — no `createConnectSession`)

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY + optional REPULL_DEMO_API_KEY
npm run dev
```

Then open <http://localhost:3000>.

## License

MIT — see [LICENSE](./LICENSE).
