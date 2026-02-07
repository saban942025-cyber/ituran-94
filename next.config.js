/** @type {import('next').NextConfig} */
const nextConfig = {
  // פותר את שגיאת ה-Unexpected token ב-undici
  experimental: {
    serverComponentsExternalPackages: ['undici', 'firebase-admin'],
  },
  // פותר את בעיית ה-Fabric.js ב-Vercel
  webpack: (config) => {
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig; 
