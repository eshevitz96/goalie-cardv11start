/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@supabase/cli-darwin-arm64/**/*',
        'node_modules/@supabase/cli-linux-x64/**/*',
        'node_modules/@supabase/cli-darwin-x64/**/*',
        'node_modules/typescript/**/*',
        'node_modules/eslint/**/*',
        'ios/**/*',
        'android/**/*',
        'dist/**/*',
      ],
    },
  },
}

module.exports = nextConfig
