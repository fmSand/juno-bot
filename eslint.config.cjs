const js = require("@eslint/js");
const globals = require("globals");
const importPlugin = require("eslint-plugin-import");
const nPlugin = require("eslint-plugin-n");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["node_modules", "coverage", "dist", "build", ".husky", "_old", "eslint.config.cjs"],
  },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  nPlugin.configs["flat/recommended"],
  prettierConfig,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "import/no-unresolved": "off",
      "n/shebang": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "no-unused-vars": "off",
      "prettier/prettier": "error",
    },
    settings: {
      node: {
        version: ">=20.0.0", // or ">=20.0.0" if you're using Node 20+
      },
    },
  },
];
