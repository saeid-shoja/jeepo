import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { NextConfig } from 'next';

const appDir = import.meta.dirname;
const monorepoRoot = join(appDir, '../..');
const isMonorepo = existsSync(join(monorepoRoot, 'pnpm-workspace.yaml'));

const nextConfig: NextConfig = {
  output: 'standalone',
  ...(isMonorepo ? { outputFileTracingRoot: monorepoRoot } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/favorites', destination: '/dashboard?tab=favorites', permanent: false },
      { source: '/messages', destination: '/dashboard?tab=messages', permanent: false },
    ];
  },
};

export default nextConfig;
