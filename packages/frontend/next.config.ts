import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Config options here */
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for web3 libraries
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    
    // Support for importing .node files
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Allow imports from contracts package in monorepo
    config.resolve.modules = [
      ...config.resolve.modules,
      path.resolve(__dirname, '../'),
    ];
    
    // Ensure JSON files can be imported
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
    });
    
    return config;
  },
  // Silence workspace root warning
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
};

export default nextConfig;
