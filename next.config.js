/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use static export for easier deployment to Firebase hosting
  output: 'export',
  // Optimize for Firebase hosting
  images: {
    unoptimized: true,
  },
  // Static exports don't support API routes, they will be handled by Firebase Functions
  // The API routes will still work when deployed to Firebase through the Functions
  
  // Fix for static export
  trailingSlash: true, 
  // Ensure all styles are included
  assetPrefix: undefined,
};

module.exports = nextConfig;