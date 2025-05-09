/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export interface ResponseMetadata {
  httpStatusCode?: number
  remainingQuota?: number | 'omit'
  quotaResetTime?: Date | 'omit'
}

export const enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
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
}

export interface CommandCache {
  get(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}

export interface CacheAble {
  readFromCache(request: Request): Promise<Response | undefined>
  putIntoCache(request: Request, response: Response): Promise<void>
}

export interface Command<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> {
  readonly isCacheAble: boolean

  readonly config: Input

  prepareRequest(context: RequestContext): Promise<Request>
  resolveResponse(response: Response): Promise<Output>
}

export interface CacheAbleCommand<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> extends Command<Input, Output>,
    CacheAble {}
