/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { toErrorResult, toSuccessResult } from '#utils/result'
import {
  DedupableMessage,
  WebExtAction,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadObject,
  WebExtMessagePayloadResponse,
} from './base'
import Joi from 'joi'

const DEDUPE_TTL_MS = 300

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

export class CheckDownloadHistoryMessage
  implements
    WebExtMessage<
      WebExtAction.CheckDownloadHistory,
      CheckDownloadHistoryMessagePayload,
      CheckDownloadHistoryResponsePayload
    >,
    DedupableMessage
{
  readonly dedupeTtlMs = DEDUPE_TTL_MS

  constructor(readonly payload: CheckDownloadHistoryMessagePayload) {}

  get dedupeId(): string {
    return `${WebExtAction.CheckDownloadHistory}:${this.payload.tweetId}`
  }

  static isResponse(value: unknown): value is CheckDownloadHistoryResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'isResponse' in value &&
      (value as { isResponse: unknown }).isResponse === true &&
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
          isResponse: true,
          action: WebExtAction.CheckDownloadHistory,
          status: 'ok',
          payload: {
            tweetId,
            isExist: (arg as CheckDownloadHistoryResponseArg).isExist,
          },
        }
      : {
          isResponse: true,
          action: WebExtAction.CheckDownloadHistory,
          status: 'error',
          reason: arg as string,
          tweetId,
        }
  }

  /**
   * @deprecated
   */
  toObject(): WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  > {
    return this.toJSON()
  }

  toJSON(): WebExtMessagePayloadObject<
    WebExtAction.CheckDownloadHistory,
    CheckDownloadHistoryMessagePayload
  > {
    return { action: WebExtAction.CheckDownloadHistory, payload: this.payload }
  }
}
