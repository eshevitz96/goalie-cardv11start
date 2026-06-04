const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
