'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';

const STARTERS = [
  'List my last 10 reservations',
  'What Airbnb listings do I have?',
  'Check my account health',
  'Start an Airbnb connect session',
];

const KEY_STORAGE = 'repull_api_key';

export function Chat() {
  const [apiKey, setApiKey] = useState('');
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load saved key once
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY_STORAGE) || '';
      setApiKey(saved);
      if (!saved) setSandbox(true);
    } catch {
      // ignore
    }
    setKeyLoaded(true);
  }, []);

  // Persist key changes
  useEffect(() => {
    if (!keyLoaded) return;
    try {
      if (apiKey) window.localStorage.setItem(KEY_STORAGE, apiKey);
      else window.localStorage.removeItem(KEY_STORAGE);
    } catch {
      // ignore
    }
  }, [apiKey, keyLoaded]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          apiKey: sandbox ? '' : apiKey,
          sandbox,
        }),
      }),
    [apiKey, sandbox],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  const isBusy = status === 'submitted' || status === 'streaming';

  const handleSend = (text: string) => {
    if (!text.trim() || isBusy) return;
    if (!sandbox && !apiKey.trim()) {
      alert('Paste your Repull API key or enable Sandbox mode.');
      return;
    }
    sendMessage({ text });
    setInput('');
  };

  return (
    <div className="flex h-screen flex-col">
      {/* top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] bg-[#0d0d0d]/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <div>
            <div className="text-sm font-semibold leading-tight">Repull Chat Demo</div>
            <div className="text-[11px] leading-tight text-white/55">
              Powered by{' '}
              <code className="rounded bg-white/[0.06] px-1 py-0.5">@repull/ai-sdk</code>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <input
            type="password"
            placeholder="Paste your Repull API key (sk_...)"
            className="w-full max-w-[360px] rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm placeholder-white/35 outline-none focus:border-indigo-400"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (e.target.value) setSandbox(false);
            }}
          />
          <label className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="accent-indigo-500"
            />
            Sandbox
          </label>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 && (
            <Welcome onPick={(p) => handleSend(p)} sandbox={sandbox} hasKey={!!apiKey} />
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isBusy && <TypingIndicator />}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              Error: {error.message}
            </div>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="border-t border-white/[0.06] bg-[#0d0d0d]/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            rows={1}
            placeholder={
              sandbox
                ? 'Ask anything — sandbox mode is on'
                : 'Ask about your reservations, listings, properties...'
            }
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm placeholder-white/35 outline-none focus:border-indigo-400"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isBusy || !input.trim()}
            className="rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? 'Thinking...' : 'Send'}
          </button>
        </div>
        <Footer />
      </div>
    </div>
  );
}

function Welcome({
  onPick,
  sandbox,
  hasKey,
}: {
  onPick: (p: string) => void;
  sandbox: boolean;
  hasKey: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20" />
      <div>
        <h1 className="text-2xl font-semibold">Chat with your Repull data</h1>
        <p className="mt-1.5 text-sm text-white/55">
          A live demo of the{' '}
          <a
            href="https://github.com/ivannikolovbg/repull-ai-sdk"
            target="_blank"
            className="text-indigo-300 hover:text-indigo-200"
            rel="noreferrer"
          >
            @repull/ai-sdk
          </a>
          . Powered by Claude — calls{' '}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 text-[12px]">api.repull.dev</code>{' '}
          on your behalf.
        </p>
        {!hasKey && !sandbox && (
          <p className="mt-3 text-xs text-amber-300/90">
            Paste your Repull API key above, or enable Sandbox mode.
          </p>
        )}
        {sandbox && (
          <p className="mt-3 text-xs text-emerald-300/90">
            Sandbox mode on — using a demo workspace. Read-only.
          </p>
        )}
      </div>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-white/85 transition hover:border-indigo-400/40 hover:bg-white/[0.04]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

type ChatMessage = ReturnType<typeof useChat>['messages'][number];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-500 text-white'
            : 'border border-white/[0.08] bg-white/[0.03] text-white/90'
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === 'text') {
            return (
              <div key={i} className="whitespace-pre-wrap">
                {part.text}
              </div>
            );
          }
          if (part.type === 'reasoning') {
            return null;
          }
          if (part.type?.startsWith('tool-')) {
            return <ToolCallView key={i} part={part} />;
          }
          if (part.type === 'step-start' && i > 0) {
            return <hr key={i} className="my-2 border-white/[0.08]" />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ToolCallView({ part }: { part: { type: string; state?: string; input?: unknown; output?: unknown } }) {
  const toolName = part.type.replace(/^tool-/, '');
  const state = part.state ?? 'unknown';
  const isDone = state === 'output-available';
  const isError = state === 'output-error';
  return (
    <details className="my-2 rounded-md border border-white/[0.08] bg-black/30 text-xs">
      <summary className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5">
        <span>
          {isError ? 'tool failed:' : isDone ? 'tool used:' : 'calling tool:'}
        </span>
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-indigo-300">
          {toolName}
        </code>
        {!isDone && !isError && <span className="ml-auto opacity-70">running...</span>}
      </summary>
      <div className="space-y-1.5 px-2.5 pb-2 pt-1 text-[11px]">
        {part.input !== undefined && (
          <div>
            <div className="text-white/45">input</div>
            <pre className="mt-0.5 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-black/40 p-2 text-white/80">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
        )}
        {part.output !== undefined && (
          <div>
            <div className="text-white/45">output</div>
            <pre className="mt-0.5 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded bg-black/40 p-2 text-white/80">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm">
        <div className="flex items-center gap-1">
          <span className="dot inline-block size-1.5 rounded-full bg-white/60" />
          <span className="dot inline-block size-1.5 rounded-full bg-white/60" />
          <span className="dot inline-block size-1.5 rounded-full bg-white/60" />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between text-[11px] text-white/45">
      <div>Repull data, your LLM provider.</div>
      <a
        href="https://vanio.ai"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-white/65 transition hover:border-indigo-400/40 hover:text-white"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        AI powered by Vanio AI
      </a>
    </div>
  );
}
