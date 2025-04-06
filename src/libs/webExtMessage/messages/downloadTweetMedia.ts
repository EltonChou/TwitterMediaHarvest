/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  WebExtAction,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadObject,
  WebExtMessageResponse,
} from './base'
import Joi from 'joi'

type DownloadTweetMediaMessagePayload = {
  tweetId: string
  screenName: string
}

const payloadSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.DownloadMedia,
    DownloadTweetMediaMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.DownloadMedia),
  payload: Joi.object<DownloadTweetMediaMessagePayload>({
    tweetId: Joi.string().required(),
    screenName: Joi.string().required(),
  }).required(),
})

export class DownloadTweetMediaMessage
  implements
    WebExtMessage<WebExtAction.DownloadMedia, DownloadTweetMediaMessagePayload>
{
  constructor(readonly payload: DownloadTweetMediaMessagePayload) {}

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
      : toSuccessResult(new DownloadTweetMediaMessage(value.payload))
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.DownloadMedia,
    DownloadTweetMediaMessagePayload
  > {
    return {
      action: WebExtAction.DownloadMedia,
      payload: this.payload,
    }
  }
}
