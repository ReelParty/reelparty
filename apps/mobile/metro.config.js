const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the whole repo and resolve from both node_modules trees.
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
// Avoid duplicate React/React Native copies across the monorepo.
config.resolver.disableHierarchicalLookup = true;

// Expo Web resolves `.web.ts`, but our shared navigation hook must use
// expo-router here — Solito's useRouter only works inside the Next.js app.
const nativeNavigation = path.resolve(
  monorepoRoot,
  "packages/app/src/navigation/useAppNavigation.native.ts",
);
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    (moduleName.endsWith("useAppNavigation") ||
      moduleName.endsWith("useAppNavigation.web"))
  ) {
    return { filePath: nativeNavigation, type: "sourceFile" };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
