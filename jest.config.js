/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/generated/prisma/client$': '<rootDir>/prisma/src/generated/prisma/client',
    '^@/generated/prisma$': '<rootDir>/prisma/src/generated/prisma',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@scalar/express-api-reference$': '<rootDir>/tests/__mocks__/scalarMock.cjs',
  },
};
