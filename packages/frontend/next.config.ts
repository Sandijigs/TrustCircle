import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Config options here */
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
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
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
