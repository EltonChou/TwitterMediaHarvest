/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { HeaderBag } from '@smithy/types'

export const enum HttpMethod {
  Post = 'POST',
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
}

interface ResponseMetadata {
  httpStatusCode?: number
  requestId?: string
}

export interface MetadataBearer {
  $metadata: ResponseMetadata
}

/**
 * @internal
 */
export interface RequestContext {
  readonly protocol: string
  readonly hostname: string
  readonly headers: HeaderBag
}

export interface Command<Input extends object, Output extends MetadataBearer> {
  readonly method: HttpMethod
  readonly path: string

  readonly config: Input

  prepareRequest(context: RequestContext): HttpRequest
  resolveResponse(response: HttpResponse): Promise<Output>
}
