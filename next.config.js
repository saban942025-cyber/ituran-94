/** @type {import('next').NextConfig} */
const nextConfig = {
  // השם המדויק לגרסה 14.2.x
  experimental: {
    serverComponentsExternalPackages: ['@firebase/storage', 'undici'],
  },
  webpack: (config) => {
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig;
