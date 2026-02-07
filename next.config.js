/** @type {import('next').NextConfig} */
const nextConfig = {
  // פותר את בעיית ה-Private Fields ב-Firebase Storage
  serverExternalPackages: ['@firebase/storage', 'undici'],
  
  webpack: (config) => {
    // פותר את בעיית ה-Fabric.js
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig;
