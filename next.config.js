/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'freestylefiendstack-freestylefiendaudiof25c6da2-5cl4r2q24cfx.s3.us-east-1.amazonaws.com'
    ]
  },
  // Only disable production source maps to reduce bundle size
  productionBrowserSourceMaps: false
};

module.exports = nextConfig;
