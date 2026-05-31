/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingExcludes: {
    '*': [
      './node_modules/@supabase/cli-darwin-arm64/**/*',
      './node_modules/@supabase/cli-linux-x64/**/*',
      './node_modules/@supabase/cli-darwin-x64/**/*',
      './node_modules/typescript/**/*',
      './node_modules/eslint/**/*',
      './node_modules/@next/swc-darwin-arm64/**/*',
      './node_modules/@next/swc-darwin-x64/**/*',
      './node_modules/@next/swc-linux-x64-gnu/**/*',
      './node_modules/@next/swc-linux-arm64-gnu/**/*',
    ],
  },
}

module.exports = nextConfig
