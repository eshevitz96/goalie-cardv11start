const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/supabase-js'],
  },
  outputFileTracingRoot: path.join(__dirname, './'),
  outputFileTracingExcludes: {
    '*': [
      'node_modules/vite/**/*',
      'ios/**/*',
      'android/**/*',
      '.next/cache/**/*',
    ],
  },
}
module.exports = nextConfig
