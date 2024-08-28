import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  WebExtAction,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadObject,
  WebExtMessageResponse,
} from './base'
import Joi from 'joi'

type DonwloadTweetMediaMessagePayload = {
  tweetId: string
  screenName: string
}

const payloadSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<WebExtAction.DownloadMedia, DonwloadTweetMediaMessagePayload>
> = Joi.object({
  action: Joi.valid(WebExtAction.DownloadMedia),
  data: Joi.object<DonwloadTweetMediaMessagePayload>({
    tweetId: Joi.string().required(),
    screenName: Joi.string().required(),
  }),
})

export class DownloadTweetMediaMessage
  implements WebExtMessage<WebExtAction.DownloadMedia, DonwloadTweetMediaMessagePayload>
{
  constructor(readonly payload: DonwloadTweetMediaMessagePayload) {}

  makeResponse(isOk: true): WebExtMessageResponse
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    ...args: [true] | [false, string]
  ): WebExtMessageResponse | WebExtMessageErrorResponse {
    const [isOk, reason] = args
    return isOk ? { status: 'ok' } : { status: 'error', reason: reason }
  }

  static validate(message: unknown): Result<DownloadTweetMediaMessage> {
    const { value, error } = payloadSchema.validate(message)

    return error
      ? toErrorResult(error)
      : toSuccessResult(new DownloadTweetMediaMessage(value.data))
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.DownloadMedia,
    DonwloadTweetMediaMessagePayload
  > {
    return {
      action: WebExtAction.DownloadMedia,
      data: this.payload,
    }
  }
}
