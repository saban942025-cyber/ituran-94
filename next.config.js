/** @type {import('next').NextConfig} */
const nextConfig = {
  // פותר את שגיאת ה-undici ו-firebase storage
  transpilePackages: ['undici', 'firebase', '@firebase/storage'],
  
  webpack: (config) => {
    // פותר את שגיאת ה-canvas ב-fabric
    config.externals.push({ canvas: 'commonjs canvas' });
    return config;
  },
};

module.exports = nextConfig;
