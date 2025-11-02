const typescript = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = {
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.json',
      sourceType: 'module'
    }
  },
  plugins: {
    '@typescript-eslint': typescript,
    import: require('eslint-plugin-import'),
    'simple-import-sort': require('eslint-plugin-simple-import-sort'),
    'unused-imports': require('eslint-plugin-unused-imports')
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  },
  rules: {
    // TypeScript recommended rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Import rules
    'import/no-unresolved': 'error',
    'import/no-duplicates': 'error',
    // Sort and cleanup imports
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports': 'error'
  }
};
