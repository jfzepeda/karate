/** @type {import('next').NextConfig} */
const exportMode = process.env.KARATE_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@karate/core"],
  // When packaging the desktop app we generate a fully static `out/` directory
  // that Electron's bundled Express server hosts.
  output: exportMode ? "export" : undefined,
  images: { unoptimized: true },
  trailingSlash: exportMode,
};

export default nextConfig;
