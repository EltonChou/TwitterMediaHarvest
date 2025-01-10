import type { JestConfigWithTsJest } from 'ts-jest'
import { createJsWithBabelPreset } from 'ts-jest'

const presetConfig = createJsWithBabelPreset({
  //...options
  tsconfig: './tsconfig.test.json',
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  coveragePathIgnorePatterns: ['dist/*'],
}

export default jestConfig
