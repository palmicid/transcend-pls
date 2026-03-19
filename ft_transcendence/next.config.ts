// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   reactCompiler: true,
//   output: "standalone",

//   // Externalize pino to avoid bundling issues with thread-stream
//   serverExternalPackages: ["pino", "pino-pretty"],
// };

// // next.config.js
// module.exports = {
//   reactStrictMode: false,
//   typescript: {
//     // !! WARN !!
//     // Dangerously allow production builds to successfully complete even if
//     // your project has type errors.
//     // !! WARN !!
//     ignoreBuildErrors: true,
//   },
// };


// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",

  reactStrictMode: false,

  serverExternalPackages: ["pino", "pino-pretty"],

  experimental: {
    instrumentationHook: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        port:"9000",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "minio",
        port: "9000",
        pathname: "/avatars",
      },
    ],
  },
};

export default nextConfig;
