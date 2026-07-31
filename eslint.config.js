import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/uploads/**",
      "**/.vite/**"
    ]
  },

  js.configs.recommended,

  {
    files: ["client/**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },

      globals: {
        ...globals.browser,
        ...globals.es2025
      }
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },

    rules: {
      ...reactHooks.configs.recommended.rules,

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true
        }
      ],

      "no-console": [
        "warn",
        {
          allow: ["warn", "error"]
        }
      ],

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      eqeqeq: ["error", "always"],

      curly: ["error", "all"],

      "prefer-const": "error",

      "no-var": "error"
    }
  },

  {
    files: ["server/**/*.js", "scripts/**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.node,
        ...globals.es2025
      }
    },

    rules: {
      "no-console": "off",

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],

      eqeqeq: ["error", "always"],

      curly: ["error", "all"],

      "prefer-const": "error",

      "no-var": "error"
    }
  },

  {
    files: ["**/*.config.js", "eslint.config.js"],

    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
