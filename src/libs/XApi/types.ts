import type {
  CacheAbleCommand,
  Command,
  MetadataBearer,
} from './commands/types'

export interface Client<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> {
  exec<InputType extends Input, OutputType extends Output>(
    command:
      | Command<InputType, OutputType>
      | CacheAbleCommand<InputType, OutputType>
  ): AsyncResult<OutputType>
}

export interface ClientConfiguration {
  /**
   * @default 10000
   * @description Default value is 10 seconds.
   * This valueshould be larger than zero or it would be processed by `Math.abs`
   */
  timeout?: number
  cookieStore?: CookieStore
}

export interface CookieStore {
  get(domain: string): Promise<string>
  set(domain: string, value: string): Promise<void>
}
