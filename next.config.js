/** @type {import('next').NextConfig} */
const nextConfig = {
  // זה התיקון הקריטי לשגיאת ה-Unexpected token (private fields #)
  experimental: {
    serverComponentsExternalPackages: ['undici', '@firebase/storage'],
  },
  webpack: (config) => {
    // פותר את בעיית ה-Fabric.js ב-Vercel
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig;
