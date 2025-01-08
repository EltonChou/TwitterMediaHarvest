import type { JestConfigWithTsJest } from 'ts-jest'
import { createDefaultEsmPreset } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({
  //...options
  tsconfig: './tsconfig.test.json',
})

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  verbose: true,
}

export default jestConfig
