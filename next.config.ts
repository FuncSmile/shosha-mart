import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pinimg.com', // Untuk Pinterest
      },
      {
        protocol: 'https',
        hostname: '**.freepik.com', // Untuk Freepik
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com', // WAJIB: Untuk Vercel Blob kamu
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Opsional: Untuk testing saja
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Naikkan jadi 5MB (sesuaikan kebutuhan)
    },
  },
};

export default nextConfig;
