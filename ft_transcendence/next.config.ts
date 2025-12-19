import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",

  // Externalize pino to avoid bundling issues with thread-stream
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
