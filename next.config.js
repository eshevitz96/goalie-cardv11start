/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Disable webpack persistent cache in dev so globals.css changes
  // hot-reload correctly without needing `rm -rf .next`.
  // Tailwind v4's @tailwindcss/postcss has a cache-key mismatch with
  // Next.js 14's webpack persistent cache when only CSS variables or
  // @keyframes change (no new utility classes are scanned).
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = nextConfig
