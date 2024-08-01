import { HttpRequest, HttpResponse } from '@smithy/protocol-http'
import { HeaderBag } from '@smithy/types'

export enum HttpMethod {
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
