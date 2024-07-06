import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  verbose: true,
  transform: {
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  setupFiles: ['fake-indexeddb/auto', 'jest-webextension-mock'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '#libs/(.*)$': '<rootDir>/src/libs/$1',
    '#backend/(.*)$': '<rootDir>/src/backend/$1',
    '#domain/(.*)$': '<rootDir>/src/domain/$1',
    '#helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '#enums/(.*)$': '<rootDir>/src/enums/$1',
    '#infra/(.*)$': '<rootDir>/src/infra/$1',
    '#constants': '<rootDir>/src/constants',
    '#utils/(.*)$': '<rootDir>/src/utils/$1',
    '#eventHandlers/(.*)$': '<rootDir>/src/eventHandlers/$1',
    '#mocks/(.*)$': '<rootDir>/src/mocks/$1',
  },
  coveragePathIgnorePatterns: ['.mock.ts', '.mock.js', 'mocks'],
}

export default jestConfig
