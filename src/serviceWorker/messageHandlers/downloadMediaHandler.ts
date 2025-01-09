import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { DownloadTweetMediaMessage } from '#libs/webExtMessage'
import {
  DownloadTweetMedia,
  type InfraProvider,
} from '../../applicationUseCases/downloadTweetMedia'
import { type MessageContextHandler, makeErrorResponse } from '../messageRouter'

const downloadMessageHandler = (
  infraProvider: InfraProvider
): MessageContextHandler => {
  const downloadTweetMedia = new DownloadTweetMedia(infraProvider, {
    remainingQuotaThreshold: 10,
  })

  return async ctx => {
    const { value: message, error } = DownloadTweetMediaMessage.validate(
      ctx.message
    )
    if (error) return ctx.response(makeErrorResponse(error.message))

    const isOk = await downloadTweetMedia.process({
      tweetInfo: new TweetInfo(message.payload),
    })

    return ctx.response(
      isOk
        ? message.makeResponse(isOk)
        : message.makeResponse(isOk, 'Failed to complete download task.')
    )
  }
}

export default downloadMessageHandler
