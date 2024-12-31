import type { Command, HttpMethod, MetadataBearer, RequestContext } from './types'
import type { HttpRequest, HttpResponse } from '@smithy/protocol-http'

export abstract class BaseCommand<
  Configuration extends object,
  Output extends MetadataBearer,
> implements Command<Configuration, Output>
{
  readonly path: string
  readonly config: Configuration
  readonly method: HttpMethod

  constructor(method: HttpMethod, path: string, config: Configuration) {
    validatePath(path)
    this.config = config
    this.path = path
    this.method = method
  }

  abstract prepareRequest(context: RequestContext): HttpRequest
  abstract resolveResponse(response: HttpResponse): Promise<Output>
}

const validatePath = (path: string) => {
  if (!path.startsWith('/'))
    throw new Error(`path should starts with \`/\`. (path: ${path})`)
}
