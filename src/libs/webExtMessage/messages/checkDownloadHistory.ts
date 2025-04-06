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

type CheckDownloadHistoryResponsePayload = {
  isExist: boolean
}

const messageSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.CheckDownloadHistory).required(),
  payload: Joi.object({ tweetId: Joi.string().required() }).required(),
})

export class CheckDownloadHistoryMessage
  implements
    WebExtMessage<
      WebExtAction.CheckDownloadHistory,
      CheckDownloadHistoryMessagePayload,
      CheckDownloadHistoryResponsePayload
    >
{
  constructor(readonly payload: CheckDownloadHistoryMessagePayload) {}

  static validate(message: unknown): Result<CheckDownloadHistoryMessage> {
    const { value, error } = messageSchema.validate(message)
    return error
      ? toErrorResult(error)
      : toSuccessResult(new CheckDownloadHistoryMessage(value.payload))
  }

  makeResponse(
    isOk: true,
    payload: CheckDownloadHistoryResponsePayload
  ): WebExtMessagePayloadResponse<CheckDownloadHistoryResponsePayload>
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    ...args: [true, CheckDownloadHistoryResponsePayload] | [false, string]
  ):
    | WebExtMessagePayloadResponse<CheckDownloadHistoryResponsePayload>
    | WebExtMessageErrorResponse {
    const [isOk, payload] = args
    return isOk
      ? { status: 'ok', payload: { isExist: payload.isExist } }
      : { status: 'error', reason: payload }
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  > {
    return { action: WebExtAction.CheckDownloadHistory, payload: this.payload }
  }
}
