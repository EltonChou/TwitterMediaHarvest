import { compilerOptions } from './tsconfig.json'
import type { JestConfigWithTsJest } from 'ts-jest'
import { pathsToModuleNameMapper } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  workerIdleMemoryLimit: '256',
  preset: 'ts-jest/presets/default-esm',
  // projects: ['src/pages'],
  verbose: false,
  testTimeout: 5000,
  transform: {
    '\\.[jt]sx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
  },
  transformIgnorePatterns: ['/!node_modules\\/@faker-js\\/faker/'],
  setupFiles: ['fake-indexeddb/auto', 'jest-webextension-mock'],
  setupFilesAfterEnv: [
    './jest.setup.ts',
    'jest-extended/all',
  ],
  roots: ['<rootDir>'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    useESM: true,
    prefix: '<rootDir>/src',
  }),
  coveragePathIgnorePatterns: ['.mock.ts', '.mock.js', 'mocks', 'utils/test/*'],
}

export default jestConfig
