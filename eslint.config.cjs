const typescript = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    // Base configuration (applies to all files)
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
    // Explicit rules (we avoid `extends` here because flat config cannot use it)
    rules: {
      // Import sorting & cleanup
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',

      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  // File-scoped config entries (flat config uses array items as glob-based overrides)
  {
    files: ['src/logger/**', 'test/**'],
    rules: {
      'no-console': 'off'
    }
  }
];
