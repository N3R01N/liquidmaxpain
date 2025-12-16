import type { NextConfig } from 'next';
import initializeBundleAnalyzer from '@next/bundle-analyzer';

// https://www.npmjs.com/package/@next/bundle-analyzer
const withBundleAnalyzer = initializeBundleAnalyzer({
  enabled: process.env.BUNDLE_ANALYZER_ENABLED === 'true'
});

// https://nextjs.org/docs/pages/api-reference/next-config-js
const nextConfig: NextConfig = {
  output: 'standalone',
  
  // FIX: Only include the actual Node.js dependencies, NOT the UI libraries
  serverExternalPackages: [
    'pino',           // Node.js logger
    'pino-pretty',    // Pretty printing for pino
    'thread-stream',  // Node.js streams
  ],
  
  // FIX: Keep UI libraries here for transpilation
  transpilePackages: [
    '@rainbow-me/rainbowkit',  // UI component library
    '@wagmi/connectors',       // ESM dependencies
    'wagmi',
    'viem',
  ],
};

export default withBundleAnalyzer(nextConfig);