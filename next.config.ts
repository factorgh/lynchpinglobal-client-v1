import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "res.cloudinary.com",
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { message: /Failed to parse source map/ },
      ];
    }
    return config;
  },
};

export default nextConfig;
