module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4 / worklets Babel plugin is added automatically by
    // babel-preset-expo when react-native-worklets is installed. Do not
    // add it here — reanimated/plugin is the same plugin and double-applying
    // it crashes Expo Go at runtime.
  };
};
