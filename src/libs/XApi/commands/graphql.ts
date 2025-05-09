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

export type QueryParams = {
  variable?: Record<string, unknown>
  feature?: Record<string, boolean>
  fieldToggles?: Record<string, boolean>
}

export type Query = {
  id: string
  method: HttpMethod
  name: string
  params: QueryParams
}

export const enum AuthType {
  Guest = 'guest',
  Auth = 'auth',
}

export abstract class GraphQLCommand<
  Input extends LiteralObject,
  Output extends MetadataBearer,
> implements Command<Input, Output>
{
  readonly bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  readonly rootPath: string = '/i/api/graphql/'

  constructor(protected query: Query) {}

  get method() {
    return this.query.method
  }

  abstract readonly authType: AuthType
  abstract isCacheAble: boolean
  abstract config: Input
  abstract prepareRequest(context: RequestContext): Promise<Request>
  abstract resolveResponse(response: Response): Promise<Output>

  protected makeEndpoint(context: RequestContext): string {
    const endpoint = new URL(
      `${context.protocol}://${context.hostname}${this.rootPath}${this.query.id}/${this.query.name}`
    )

    if (this.query.params.feature) {
      endpoint.searchParams.append(
        'features',
        JSON.stringify(this.query.params.feature)
      )
    }

    if (this.query.params.fieldToggles) {
      endpoint.searchParams.append(
        'fieldToggles',
        JSON.stringify(this.query.params.fieldToggles)
      )
    }

    if (this.query.params.variable) {
      endpoint.searchParams.append(
        'variables',
        JSON.stringify(this.query.params.variable)
      )
    }

    return endpoint.href
  }

  protected makeAuthHeaders(csrfToken: string, transactionId?: string) {
    if (this.authType === AuthType.Guest) {
      return new Headers([
        ['x-twitter-active-user', 'yes'],
        ['x-guest-token', csrfToken],
      ])
    }

    if (this.authType === AuthType.Auth) {
      return transactionId
        ? new Headers([
            ['x-twitter-active-user', 'yes'],
            ['x-csrf-token', csrfToken],
            ['x-guest-token', csrfToken],
            ['x-client-transaction-id', transactionId],
          ])
        : new Headers([
            ['x-twitter-active-user', 'yes'],
            ['x-csrf-token', csrfToken],
            ['x-guest-token', csrfToken],
          ])
    }

    return new Headers()
  }

  protected makeHeaders(headers: Headers): Headers {
    return new Headers([
      ['Content-Type', 'application/json'],
      ['Authorization', 'Bearer ' + this.bearerToken],
      ['User-Agent', navigator.userAgent],
      ...headers,
    ])
  }
}
