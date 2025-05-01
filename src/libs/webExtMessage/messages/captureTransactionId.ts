/**
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

type CaptureTransactionIdMessagePayload = {
  transactionId: string
  path: string
  method: string
}

export class CaptureTransactionIdMessage
  implements
    WebExtMessage<
      WebExtAction.CaptureTransactionId,
      CaptureTransactionIdMessagePayload
    >
{
  constructor(readonly payload: CaptureTransactionIdMessagePayload) {}

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.CaptureTransactionId,
    CaptureTransactionIdMessagePayload
  > {
    return { action: WebExtAction.CaptureTransactionId, payload: this.payload }
  }

  makeResponse(isOk: true): WebExtMessageResponse
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    ...args: [true] | [false, string]
  ): WebExtMessageResponse | WebExtMessageErrorResponse {
    const [isOk, reason] = args

    if (isOk) return { status: 'ok' }
    return { status: 'error', reason }
  }

  static validate(message: unknown): Result<CaptureTransactionIdMessage> {
    const { value, error } = messageSchema.validate(message)
    if (error) return toErrorResult(error)
    return toSuccessResult(new CaptureTransactionIdMessage(value.payload))
  }
}

const payloadSchema: Joi.ObjectSchema<CaptureTransactionIdMessagePayload> =
  Joi.object({
    method: Joi.string().required(),
    path: Joi.string().required(),
    transactionId: Joi.string().required(),
  })

const messageSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.CaptureTransactionId,
    CaptureTransactionIdMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.CaptureTransactionId).required(),
  payload: payloadSchema.unknown(false).required(),
}).unknown(false)
