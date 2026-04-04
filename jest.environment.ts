import JSDOMEnvironment from 'jest-environment-jsdom'
import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment'

export default class CustomJSDOMEnvironment extends JSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context)
    this.global.setJSDOMURL = (url: string) => {
      this.dom?.reconfigure({ url })
    }
  }
}
