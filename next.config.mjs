/** @type {import('next').NextConfig} */
const nextConfig = {
  // PSV and three are client-only (they touch `window`); nothing to transpile,
  // but we keep React strict mode on for early warnings.
  reactStrictMode: true,
  // Keep generated builds, runtime logs, and traces out of the project root.
  distDir: "temp/.next",
};

export default nextConfig;
