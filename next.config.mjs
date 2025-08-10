/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  webpack: (config) => {
    // Avoid bundling server-only modules in face-api.js deps
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      encoding: false,
    };
    return config;
  }
};

export default nextConfig;




