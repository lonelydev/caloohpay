module.exports = {
  // Use the ts-jest preset for basic configuration
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  // Specify the environment (node is common for backend/utility libraries)
  testEnvironment: 'node',
  // Pattern to find test files
  testRegex: '/test/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  // The directory where Jest should output its reports
  coverageDirectory: 'coverage',
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts', // Exclude type definition files
    '!src/index.ts', // Optionally exclude entry files
  ],
};