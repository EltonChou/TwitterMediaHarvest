import type { JestConfigWithTsJest } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest'
import ts from 'typescript'

const tsConfig = ts.readConfigFile('./tsconfig.json', ts.sys.readFile)

const jestConfig: JestConfigWithTsJest = {
  workerIdleMemoryLimit: '256',
  preset: 'ts-jest/presets/default-esm',
  verbose: false,
  testTimeout: 5000,
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)(spec|test).mjs',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: ['webpac'],
  transform: {
    '\\.m?[jt]sx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
  },
  transformIgnorePatterns: ['/!node_modules\\/@faker-js\\/faker/'],
  setupFiles: ['fake-indexeddb/auto', 'jest-webextension-mock'],
  setupFilesAfterEnv: ['./jest.setup.ts', 'jest-extended/all'],
  roots: ['<rootDir>'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsConfig.config.compilerOptions.paths, {
      useESM: true,
      prefix: '<rootDir>/src',
    }),
    '#monitor': '<rootDir>/src/monitors/console.ts',
  },
  coveragePathIgnorePatterns: ['.mock.ts', '.mock.js', 'mocks', 'utils/test/*'],
  coverageReporters: ['clover', 'json', 'lcov', ['text', { skipFull: true }]],
}

export default jestConfig
