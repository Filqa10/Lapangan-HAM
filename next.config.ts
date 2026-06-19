import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-1574629810360-7efbbe195018',
        search: '?auto=format&fit=crop&w=1200&q=80',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-1551698618-1dfe5d97d256',
        search: '?auto=format&fit=crop&w=1200&q=80',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-1517927033932-b3d18e61fb3a',
        search: '?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
};

export default nextConfig;
