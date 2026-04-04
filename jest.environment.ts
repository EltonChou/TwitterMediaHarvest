import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment'
import JSDOMEnvironment from 'jest-environment-jsdom'

export default class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.global.setJSDOMURL = (url: string) => {
      this.dom?.reconfigure({ url })
    }
  }
}
