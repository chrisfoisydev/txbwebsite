import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: 'export', distDir: '.next-production', turbopack: { root: process.cwd() } };
export default nextConfig;


