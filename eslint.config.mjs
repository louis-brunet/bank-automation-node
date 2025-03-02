import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,mts}'],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.{mts,mjs}', 'test/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    rules: {
      // '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
