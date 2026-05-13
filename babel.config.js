module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          alias: {
            "@shared": "./src/shared",
            "@features": "./src/features",
          },
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
