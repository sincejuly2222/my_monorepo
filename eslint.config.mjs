import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      ".playwright-cli/**",
    ],
  },
  {
    ...eslint.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ["apps/vue-web/**/*.vue"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginVue.configs["flat/recommended"],
    ],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: [".vue"] },
      globals: globals.browser,
    },
    rules: {
      "vue/multi-word-component-names": ["error", { ignores: ["App"] }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/vue-web/src/**/*.ts"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["apps/web/src/**/*.tsx"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["error", { allowConstantExport: true }],
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}", "apps/vue-web/src/**/*.{ts,vue}"],
    ignores: ["apps/web/src/main.tsx", "apps/vue-web/src/main.ts"],
    rules: {
      // 全局样式仅由应用入口导入，组件和页面使用 CSS Modules。
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ImportDeclaration[source.value=/[.]css$/]:not([source.value=/[.]module[.]css$/])",
          message: "页面和组件请使用 CSS Modules，全局 CSS 只能由应用 main 入口导入。",
        },
      ],
    },
  },
  {
    files: ["services/**/*.ts", "services-nest/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
);
