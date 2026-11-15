import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '3mb' }, cpus: 2 },
  poweredByHeader: false,
};
export default config;
