/** @type {import('next').NextConfig} */
const nextConfig = {
  // PSV and three are client-only (they touch `window`); nothing to transpile,
  // but we keep React strict mode on for early warnings.
  reactStrictMode: true,
};

export default nextConfig;
