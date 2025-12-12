/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    'node_modules'
  ],
  testPathIgnorePatterns: [
    'dist/'
  ],
  moduleNameMapper: {
    '^~/intf/(.*)$': '<rootDir>/src/interfaces/$1',
    '^~/service/(.*)$': '<rootDir>/src/services/$1',
    '^~/repo/(.*)$': '<rootDir>/src/repositories/$1',
    '^~/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '\\.(ts)$': 'ts-jest'
  },
  // globalTeardown: '<rootDir>/test/globalTeardown.ts',
};