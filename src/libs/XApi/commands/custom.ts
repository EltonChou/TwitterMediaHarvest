import { GraphQLCommand } from './graphql'
import type { MetadataBearer, RequestContext } from './types'

export abstract class CustomCommand<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> extends GraphQLCommand<Input, Output> {
  abstract isCacheAble: boolean
  abstract config: Input

  prepareRequest(_context: RequestContext): Promise<Request> {
    throw new Error('Method not implemented.')
  }
  resolveResponse(_response: Response): Promise<Output> {
    throw new Error('Method not implemented.')
  }
}
