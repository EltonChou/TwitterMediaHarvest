/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CheckDownloadHistoryMessage } from '#libs/webExtMessage'
import {
  CheckMediaTweetHasBeenDownloaded,
  type InfraProvider,
} from '../../applicationUseCases/checkMediaTweetHasBeenDownloaded'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

const checkDownloadHistoryHandler = (
  infraProvider: InfraProvider
): MessageContextHandler => {
  const checkMediaTweetHasBeenDownloaded = new CheckMediaTweetHasBeenDownloaded(
    infraProvider
  )

  return async ctx => {
    const { value: message, error } = CheckDownloadHistoryMessage.validate(
      ctx.message
    )
    if (error) return ctx.response(makeErrorResponse(error.message))

    const isExist = await checkMediaTweetHasBeenDownloaded.process({
      tweetId: message.payload.tweetId,
    })

    return ctx.response(message.makeResponse(true, { isExist }))
  }
}

export default checkDownloadHistoryHandler
