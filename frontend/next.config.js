/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable static export when NEXT_OUTPUT env var is set to 'export'
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  // Disable image optimization for static export
  images: {
    unoptimized: process.env.NEXT_OUTPUT === 'export',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    // Skip rewrites for static export
    if (process.env.NEXT_OUTPUT === 'export') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  // Trailing slash for better static hosting compatibility
  trailingSlash: true,
  // Skip type checking during build (optional - speeds up build)
  typescript: {
    ignoreBuildErrors: process.env.NEXT_OUTPUT === 'export',
  },
  // Skip ESLint during build (optional - speeds up build)
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_OUTPUT === 'export',
  },
};

module.exports = nextConfig;
