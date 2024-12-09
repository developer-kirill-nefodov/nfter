const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {ignores: ['dist/**', 'node_modules/**', 'src/migrations/**']},
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true},
      ],
      '@typescript-eslint/consistent-type-imports': ['error', {prefer: 'type-imports'}],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
    },
  },
);
