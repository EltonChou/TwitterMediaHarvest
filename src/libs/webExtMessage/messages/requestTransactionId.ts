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

type RequestTransactionIdResponseArg = {
  transactionId: string
}

type RequestTransactionIdMessageResponsePayload = {
  transactionId: string
  method: string
  path: string
}

export type RequestTransactionIdResponse =
  | WebExtMessagePayloadResponse<
      RequestTransactionIdMessageResponsePayload,
      WebExtAction.RequestTransactionId
    >
  | WebExtMessageErrorResponse<WebExtAction.RequestTransactionId>

export type RequestTransactionIdOkResponse = WebExtMessagePayloadResponse<
  RequestTransactionIdMessageResponsePayload,
  WebExtAction.RequestTransactionId
>

export class RequestTransactionIdMessage implements WebExtMessage<
  WebExtAction.RequestTransactionId,
  RequestTransactionIdMessagePayload,
  RequestTransactionIdMessageResponsePayload
> {
  constructor(readonly payload: RequestTransactionIdMessagePayload) {}

  makeResponse(
    isOk: true,
    arg: RequestTransactionIdResponseArg
  ): RequestTransactionIdOkResponse
  makeResponse(
    isOk: false,
    reason: string
  ): WebExtMessageErrorResponse<WebExtAction.RequestTransactionId>
  makeResponse(
    ...args: [true, RequestTransactionIdResponseArg] | [false, string]
  ): RequestTransactionIdResponse {
    const [isOk, arg] = args
    const { method, path } = this.payload
    return isOk
      ? {
          isResponse: true,
          action: WebExtAction.RequestTransactionId,
          status: 'ok',
          payload: {
            transactionId: (arg as RequestTransactionIdResponseArg)
              .transactionId,
            method,
            path,
          },
        }
      : {
          isResponse: true,
          action: WebExtAction.RequestTransactionId,
          status: 'error',
          reason: arg as string,
        }
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.RequestTransactionId,
    RequestTransactionIdMessagePayload
  > {
    return { action: WebExtAction.RequestTransactionId, payload: this.payload }
  }

  asOneShot() {
    return {
      inner: this,
      isOneShot: true as const,
    }
  }

  static validate(message: unknown): Result<RequestTransactionIdMessage> {
    const { value, error } = messageSchema.validate(message)
    if (error) return toErrorResult(error)
    return toSuccessResult(new RequestTransactionIdMessage(value.payload))
  }

  static validateResponse(
    message: unknown
  ): Result<RequestTransactionIdResponse> {
    const { value, error } = responseSchema.validate(message)
    if (error) return toErrorResult(error)
    return toSuccessResult(value as RequestTransactionIdResponse)
  }

  static isResponse(value: unknown): value is RequestTransactionIdResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'isResponse' in value &&
      (value as { isResponse: unknown }).isResponse === true &&
      'action' in value &&
      (value as { action: unknown }).action ===
        WebExtAction.RequestTransactionId
    )
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

const okResponseSchema: Joi.ObjectSchema<RequestTransactionIdOkResponse> =
  Joi.object({
    isResponse: Joi.valid(true).required(),
    action: Joi.valid(WebExtAction.RequestTransactionId).required(),
    status: Joi.valid('ok').required(),
    payload: Joi.object({
      transactionId: Joi.string().required(),
      method: Joi.string().required(),
      path: Joi.string().required(),
    }).required(),
  })

const errorResponseSchema: Joi.ObjectSchema<
  WebExtMessageErrorResponse<WebExtAction.RequestTransactionId>
> = Joi.object({
  isResponse: Joi.valid(true).required(),
  action: Joi.valid(WebExtAction.RequestTransactionId).required(),
  status: Joi.valid('error').required(),
  reason: Joi.string().required(),
})

const responseSchema = Joi.alternatives<RequestTransactionIdResponse>(
  okResponseSchema,
  errorResponseSchema
)
