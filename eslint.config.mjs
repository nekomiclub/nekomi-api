/**
 * @fileoverview nodejs eslint@9 config
 * @version 04.11.2026
 */



import js from '@eslint/js';
import path from 'node:path';
import pathPlugin from 'eslint-plugin-path';
import sortImportsEs6Autofix from 'eslint-plugin-sort-imports-es6-autofix';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import unusedImports from 'eslint-plugin-unused-imports';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'node:url';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [{
  ignores: ['**/node_modules', '**/dist', '**/build', '**/.cache', '**/.dump'],
}, ...compat.extends(
  'eslint:recommended',
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended',
), {
  plugins: {
    '@typescript-eslint': typescriptEslint,
    'sort-imports-es6-autofix': sortImportsEs6Autofix,
    'unused-imports': unusedImports,
    'path': pathPlugin,
  },

  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  rules: {
    indent: ['error', 2, {
      SwitchCase: 1,
    }],

    '@typescript-eslint/no-unused-expressions': 'off',

    'linebreak-style': ['error', 'windows'],

    'no-unused-vars': ['off', {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false,
    }],

    semi: ['warn', 'always'],

    quotes: ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: true,
    }],

    'prefer-const': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'no-empty': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    'unused-imports/no-unused-imports': 'error',

    'sort-imports-es6-autofix/sort-imports-es6': [2, {
      ignoreCase: false,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'],
    }],

    'path/no-relative-imports': ['error', {
      maxDepth: 0,
    }],
  },
}];