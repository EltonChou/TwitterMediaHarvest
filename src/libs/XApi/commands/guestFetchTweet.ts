/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { AuthType } from './graphql'
import { RestIdFetchTweetCommand } from './restIdFetchTweet'
import { RequestContext } from './types'
import { fromNullable } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/function'

/**
 * This command only works when csrf token (aka guest token) is all numbers.
 */
export class GuestFetchTweetCommand extends RestIdFetchTweetCommand {
  readonly authType: AuthType = AuthType.Guest
  readonly rootPath: string = '/graphql/'

  async prepareRequest(context: RequestContext): Promise<Request> {
    return super.prepareRequest({ ...context, hostname: 'api.x.com' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getResultFromBody(body: any) {
    return pipe(
      body?.data?.tweetResult?.result,
      fromNullable('Failed to get result')
    )
  }
}
