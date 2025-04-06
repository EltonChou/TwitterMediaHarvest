/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  Command,
  HttpMethod,
  MetadataBearer,
  RequestContext,
} from './types'
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
