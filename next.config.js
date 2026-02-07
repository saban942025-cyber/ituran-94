/** @type {import('next').NextConfig} */
const nextConfig = {
  // פותר את בעיית ה-Private Fields בגרסאות Node ישנות/ספריות מודרניות
  experimental: {
    serverComponentsExternalPackages: ['undici'],
  },
  webpack: (config) => {
    // מונע מ-Webpack לנסות לקמפל ספריות צד-שרת של Fabric בתוך Vercel
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig;
