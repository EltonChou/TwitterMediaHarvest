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
  WebExtMessagePayloadResponse,
} from './base'
import Joi from 'joi'

type RequestTransactionIdMessagePayload = {
  path: string
  method: string
}

type RequestTransactionIdMessageResponsePayload = {
  transactionId: string
}

export class RequestTransactionIdMessage
  implements
    WebExtMessage<
      WebExtAction.RequestTransactionId,
      RequestTransactionIdMessagePayload,
      RequestTransactionIdMessageResponsePayload
    >
{
  constructor(readonly payload: RequestTransactionIdMessagePayload) {}

  makeResponse(
    isOk: true,
    payload: RequestTransactionIdMessageResponsePayload
  ): WebExtMessagePayloadResponse<RequestTransactionIdMessageResponsePayload>
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    isOk: unknown,
    reason: unknown
  ):
    | WebExtMessagePayloadResponse<RequestTransactionIdMessageResponsePayload>
    | WebExtMessageErrorResponse {
    if (isOk === true && this.isResponsePayload(reason)) {
      return {
        status: 'ok',
        payload: reason,
      }
    }

    if (isOk === false && typeof reason === 'string') {
      return {
        status: 'error',
        reason,
      }
    }

    throw new Error('Invalid arguments to makeResponse')
  }

  private isResponsePayload(
    payload: unknown
  ): payload is RequestTransactionIdMessageResponsePayload {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'transactionId' in payload
    )
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.RequestTransactionId,
    RequestTransactionIdMessagePayload
  > {
    return { action: WebExtAction.RequestTransactionId, payload: this.payload }
  }

  static validate(message: unknown): Result<RequestTransactionIdMessage> {
    const { value, error } = messageSchema.validate(message)
    if (error) return toErrorResult(error)
    return toSuccessResult(new RequestTransactionIdMessage(value.payload))
  }
}

const payloadSchema: Joi.ObjectSchema<RequestTransactionIdMessagePayload> =
  Joi.object({
    method: Joi.string().required(),
    path: Joi.string().required(),
  }).unknown(false)

const messageSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.RequestTransactionId,
    RequestTransactionIdMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.RequestTransactionId).required(),
  payload: payloadSchema.required(),
}).unknown(false)
