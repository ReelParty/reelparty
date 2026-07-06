import path from "path";
import { fileURLToPath } from "url";

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Allow ngrok / other HTTPS tunnels to load dev assets and HMR in development.
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  transpilePackages: [
    // React Native ecosystem (must be transpiled for the browser).
    "react-native",
    "react-native-web",
    "react-native-svg",
    "react-native-safe-area-context",
    "nativewind",
    "react-native-css-interop",
    "lucide-react-native",
    "solito",
    // Internal workspace packages (shipped as TS source).
    "@reelparty/app",
    "@reelparty/ui",
    "@reelparty/shared",
    "@reelparty/api",
  ],
  turbopack: {
    root: monorepoRoot,
    resolveAlias: {
      "react-native": "react-native-web",
    },
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // react-native-web provides the DOM implementations of RN primitives.
      "react-native$": "react-native-web",
      "lucide-react-native": "lucide-react-native",
    };
    config.resolve.extensions = [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ...config.resolve.extensions,
    ];
    return config;
  },
};

export default nextConfig;
