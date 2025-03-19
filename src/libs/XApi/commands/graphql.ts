import type { RequestContext } from './types'

export type QueryParams = {
  variable?: Record<string, unknown>
  feature?: Record<string, boolean>
  fieldToggles?: Record<string, boolean>
}

export const enum QueryMethod {
  Get = 'GET',
  Post = 'POST',
}

export type Query = {
  id: string
  method: QueryMethod
  name: string
  params: QueryParams
}

export const enum AuthType {
  Guest = 'guest',
  Auth = 'auth',
}

export abstract class GraphQLCommand {
  abstract readonly authType: AuthType

  readonly bearerToken =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

  constructor(protected query: Query) {}

  protected makeEndpoint(context: RequestContext): string {
    const endpoint = new URL(
      `${context.protocol}://${context.hostname}/i/api/graphql/${this.query.id}/${this.query.name}`
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

  protected makeAuthHeaders(csrfToken: string) {
    if (this.authType === AuthType.Guest) {
      return new Headers([
        ['x-twitter-active-user', 'yes'],
        ['x-csrf-token', csrfToken],
        ['x-twitter-auth-type', 'OAuth2Session'],
      ])
    }

    if (this.authType === AuthType.Auth) {
      return new Headers([
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
