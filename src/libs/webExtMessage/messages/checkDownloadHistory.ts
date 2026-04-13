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

type CheckDownloadHistoryMessagePayload = {
  tweetId: string
}

type CheckDownloadHistoryResponseArg = {
  isExist: boolean
}

type CheckDownloadHistoryResponsePayload = {
  tweetId: string
  isExist: boolean
}

export type CheckDownloadHistoryResponse =
  | WebExtMessagePayloadResponse<
      CheckDownloadHistoryResponsePayload,
      WebExtAction.CheckDownloadHistory
    >
  | WebExtMessageErrorResponse<
      WebExtAction.CheckDownloadHistory,
      { tweetId: string }
    >

const messageSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.CheckDownloadHistory).required(),
  payload: Joi.object({ tweetId: Joi.string().required() }).required(),
})

export class CheckDownloadHistoryMessage implements WebExtMessage<
  WebExtAction.CheckDownloadHistory,
  CheckDownloadHistoryMessagePayload,
  CheckDownloadHistoryResponsePayload
> {
  constructor(readonly payload: CheckDownloadHistoryMessagePayload) {}

  static isResponse(value: unknown): value is CheckDownloadHistoryResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'action' in value &&
      (value as { action: unknown }).action ===
        WebExtAction.CheckDownloadHistory
    )
  }

  static validate(message: unknown): Result<CheckDownloadHistoryMessage> {
    const { value, error } = messageSchema.validate(message)
    return error
      ? toErrorResult(error)
      : toSuccessResult(new CheckDownloadHistoryMessage(value.payload))
  }

  makeResponse(
    isOk: true,
    arg: CheckDownloadHistoryResponseArg
  ): WebExtMessagePayloadResponse<
    CheckDownloadHistoryResponsePayload,
    WebExtAction.CheckDownloadHistory
  >
  makeResponse(
    isOk: false,
    reason: string
  ): WebExtMessageErrorResponse<
    WebExtAction.CheckDownloadHistory,
    { tweetId: string }
  >
  makeResponse(
    ...args: [true, CheckDownloadHistoryResponseArg] | [false, string]
  ):
    | WebExtMessagePayloadResponse<
        CheckDownloadHistoryResponsePayload,
        WebExtAction.CheckDownloadHistory
      >
    | WebExtMessageErrorResponse<
        WebExtAction.CheckDownloadHistory,
        { tweetId: string }
      > {
    const [isOk, arg] = args
    const tweetId = this.payload.tweetId
    return isOk
      ? {
          action: WebExtAction.CheckDownloadHistory,
          status: 'ok',
          payload: {
            tweetId,
            isExist: (arg as CheckDownloadHistoryResponseArg).isExist,
          },
        }
      : {
          action: WebExtAction.CheckDownloadHistory,
          status: 'error',
          reason: arg as string,
          tweetId,
        }
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  > {
    return { action: WebExtAction.CheckDownloadHistory, payload: this.payload }
  }

  asOneShot() {
    return {
      inner: this,
      isOneShot: true as const,
    }
  }
}
