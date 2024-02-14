require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  extends: ["@toruslabs/eslint-config-typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2022,
    project: "./tsconfig.json",
  },
  ignorePatterns: [".eslintrc.cjs", "*.config.ts"],
  rules: {
    "@typescript-eslint/no-throw-literal": 0,
    "no-case-declarations": 0,
    "require-atomic-updates": 0,
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
      },
    ],
  },
  env: {
    es2020: true,
    browser: true,
    node: true,
  },
};
