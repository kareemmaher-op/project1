/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  clearMocks: true,
  setupFiles: [],
};
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.int.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/types/**',
    '!src/utils/**',
    '!src/database/entities/**',
    '!src/database/repositories/**',
    '!src/services/userService.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};