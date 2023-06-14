/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

function generateWebpackConfig({ pkg, currentPath, alias, module = {}, ssrModule = null, pkgBaseConfig = {} }) {
  const depsList = Object.keys(pkg.dependencies);
  const baseConfig = {
    ...pkgBaseConfig,
    resolve: {
      plugins: [],
      alias: {
        ...(depsList.includes("bn.js") && { "bn.js": path.resolve(currentPath, "node_modules/bn.js") }),
        ...alias,
      },
      fallback: {
        "bn.js": require.resolve("bn.js"),
      },
    },
  };

  const config = { baseConfig, umdConfig: {}, cjsConfig: {} };
  config.umdConfig = {
    module,
  };

  config.cjsConfig = {
    module: ssrModule || module,
  };

  return config;
}

const pkg = require("./package.json");

const currentPath = path.resolve(".");

const config = generateWebpackConfig({
  currentPath,
  pkg,
  alias: {},
});

module.exports = config;
