import { DomainEvent } from './base'

type Options = {
  isExplicit: boolean
}

export default class InternalErrorHappened
  extends DomainEvent
  implements InternalErrorEvent
{
  readonly reason: string
  readonly error: Error
  readonly isExplicit: boolean

  constructor(reason: string, error: Error, options?: Options) {
    super('runtime:error:internal')
    this.reason = reason
    this.error = error
    this.isExplicit = Boolean(options?.isExplicit)
  }
}
