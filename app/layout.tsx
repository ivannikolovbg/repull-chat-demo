import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Repull Chat Demo',
  description:
    'Live chat demo for the Repull AI SDK. Paste your Repull API key, ask Claude or GPT about your data — the LLM uses Repull tools to call api.repull.dev.',
  openGraph: {
    title: 'Repull Chat Demo',
    description:
      'Paste your Repull API key, ask Claude about your data. Powered by the @repull/ai-sdk.',
    url: 'https://repull-chat-demo.vercel.app',
    siteName: 'Repull Chat Demo',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
