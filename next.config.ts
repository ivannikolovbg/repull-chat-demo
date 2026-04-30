import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vendored SDK reads from local source files
  transpilePackages: ['@repull/ai-sdk'],
};

export default nextConfig;
