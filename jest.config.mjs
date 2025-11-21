/**
 * JEST CONFIG  
 * 
 * @copyright fullkekw
 * @version 19.04.2025
*/

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!variables/.*)'
  ],
  testPathIgnorePatterns: [
    'dist/'
  ],
  moduleNameMapper: {
    '^~/core/(.*)$': '<rootDir>/src/_core/$1',
    '^~/interfaces/(.*)$': '<rootDir>/src/_core/interfaces/$1',
    '^~/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '\\.(ts)$': 'ts-jest'
  },
  // globalTeardown: '<rootDir>/test/globalTeardown.ts',
};