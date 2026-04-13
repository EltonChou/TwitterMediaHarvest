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
  WebExtMessagePayloadResponse,
} from './base'
import Joi from 'joi'

type DownloadTweetMediaMessagePayload = {
  tweetId: string
  screenName: string
}

export type DownloadTweetMediaResponse =
  | WebExtMessagePayloadResponse<
      { tweetId: string },
      WebExtAction.DownloadMedia
    >
  | WebExtMessageErrorResponse<WebExtAction.DownloadMedia, { tweetId: string }>

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

export class DownloadTweetMediaMessage implements WebExtMessage<
  WebExtAction.DownloadMedia,
  DownloadTweetMediaMessagePayload
> {
  constructor(readonly payload: DownloadTweetMediaMessagePayload) {}

  makeResponse(
    isOk: true
  ): WebExtMessagePayloadResponse<
    { tweetId: string },
    WebExtAction.DownloadMedia
  >
  makeResponse(
    isOk: false,
    reason: string
  ): WebExtMessageErrorResponse<WebExtAction.DownloadMedia, { tweetId: string }>
  makeResponse(
    ...args: [true] | [false, string]
  ):
    | WebExtMessagePayloadResponse<
        { tweetId: string },
        WebExtAction.DownloadMedia
      >
    | WebExtMessageErrorResponse<
        WebExtAction.DownloadMedia,
        { tweetId: string }
      > {
    const [isOk, reason] = args
    const tweetId = this.payload.tweetId
    return isOk
      ? {
          action: WebExtAction.DownloadMedia,
          status: 'ok',
          payload: { tweetId },
        }
      : {
          action: WebExtAction.DownloadMedia,
          status: 'error',
          reason: reason,
          tweetId,
        }
  }

  static isResponse(value: unknown): value is DownloadTweetMediaResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'action' in value &&
      (value as { action: unknown }).action === WebExtAction.DownloadMedia
    )
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

  asOneShot() {
    return {
      inner: this,
      isOneShot: true as const,
    }
  }
}
