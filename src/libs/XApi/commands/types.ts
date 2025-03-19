export interface ResponseMetadata {
  httpStatusCode?: number
  remainingQuota?: number | 'omit'
  quotaResetTime?: Date | 'omit'
}

export const enum HttpMethod {
  Get = 'GET',
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
  readonly method: HttpMethod

  readonly config: Input

  prepareRequest(context: RequestContext): Request
  resolveResponse(response: Response): Promise<Output>
}

export interface CacheAbleCommand<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> extends Command<Input, Output>,
    CacheAble {}
