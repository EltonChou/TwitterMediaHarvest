/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DownloadTweetMediaMessage, sendTabMessage } from '#libs/webExtMessage'
import { RequestTransactionIdMessage } from '#libs/webExtMessage/messages/requestTransactionId'
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  DownloadTweetMedia,
  type InfraProvider,
} from '../../applicationUseCases/downloadTweetMedia'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

const downloadMessageHandler = (
  infraProvider: InfraProvider
): MessageContextHandler => {
  const downloadTweetMedia = new DownloadTweetMedia(infraProvider)

  return async ctx => {
    const { value: message, error } = DownloadTweetMediaMessage.validate(
      ctx.message
    )
    if (error) return ctx.response(makeErrorResponse(error.message))

    const isOk = await downloadTweetMedia.process({
      tweetInfo: new TweetInfo(message.payload),
      xTransactionIdProvider: async (path, method) => {
        if (ctx.sender.tab?.id) {
          const response = await sendTabMessage(ctx.sender.tab?.id)(
            new RequestTransactionIdMessage({ path, method })
          )
          if (response.status === 'ok')
            return toSuccessResult(response.payload.transactionId)
        }

        return toErrorResult(new Error('Failed to request transaction id'))
      },
    })

    return ctx.response(
      isOk
        ? message.makeResponse(isOk)
        : message.makeResponse(isOk, 'Failed to complete download task.')
    )
  }
}

export default downloadMessageHandler
