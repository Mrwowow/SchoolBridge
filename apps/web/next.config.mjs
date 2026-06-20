/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@schoolbridge/types'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
