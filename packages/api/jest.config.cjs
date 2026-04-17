module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // ESM packages must be transformed or auto-mocked
  moduleNameMapper: {
    '^expo-server-sdk$': '<rootDir>/src/__mocks__/expo-server-sdk.ts',
    '^web-push$': '<rootDir>/src/__mocks__/web-push.ts',
    '^node-cron$': '<rootDir>/src/__mocks__/node-cron.ts',
  },
};
