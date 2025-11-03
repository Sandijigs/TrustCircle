import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config options here */
  reactStrictMode: true,
  webpack: (config) => {
    // Fix for web3 libraries
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    // Support for importing .node files
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
