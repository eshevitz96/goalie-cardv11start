const config = {
  plugins: {
    // optimize: false disables Tailwind v4's internal incremental cache.
    // Without this, scoped CSS variable changes and @keyframes additions
    // in globals.css can be served from a stale cache during hot reload.
    "@tailwindcss/postcss": { optimize: false },
  },
};

export default config;
