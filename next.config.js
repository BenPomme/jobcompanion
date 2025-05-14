/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize for Firebase hosting
  images: {
    unoptimized: true,
  },
  // Support for Firebase's experimental support for Next.js
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Ensure we support API routes properly through Firebase Functions
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;