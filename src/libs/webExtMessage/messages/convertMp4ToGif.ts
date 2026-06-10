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

type ConvertMp4ToGifMessagePayload = {
  url: string
}

type ConvertMp4ToGifMessageResponsePayload = {
  dataUrl: string
}

const payloadSchema: Joi.ObjectSchema<
  WebExtMessagePayloadObject<
    WebExtAction.ConvertMp4ToGif,
    ConvertMp4ToGifMessagePayload
  >
> = Joi.object({
  action: Joi.valid(WebExtAction.ConvertMp4ToGif),
  payload: Joi.object<ConvertMp4ToGifMessagePayload>({
    url: Joi.string().required(),
  }).required(),
})

export class ConvertMp4ToGifMessage implements WebExtMessage<
  WebExtAction.ConvertMp4ToGif,
  ConvertMp4ToGifMessagePayload,
  ConvertMp4ToGifMessageResponsePayload
> {
  constructor(readonly payload: ConvertMp4ToGifMessagePayload) {}

  makeResponse(
    isOk: true,
    payload: ConvertMp4ToGifMessageResponsePayload
  ): WebExtMessagePayloadResponse<ConvertMp4ToGifMessageResponsePayload>
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
  makeResponse(
    ...args: [true, ConvertMp4ToGifMessageResponsePayload] | [false, string]
  ):
    | WebExtMessagePayloadResponse<ConvertMp4ToGifMessageResponsePayload>
    | WebExtMessageErrorResponse {
    const [isOk, data] = args
    return isOk
      ? { status: 'ok', payload: data }
      : { status: 'error', reason: data as string }
  }

  static validate(message: unknown): Result<ConvertMp4ToGifMessage> {
    const { value, error } = payloadSchema.validate(message)

    return error
      ? toErrorResult(error)
      : toSuccessResult(new ConvertMp4ToGifMessage(value.payload))
  }

  toObject(): WebExtMessagePayloadObject<
    WebExtAction.ConvertMp4ToGif,
    ConvertMp4ToGifMessagePayload
  > {
    return {
      action: WebExtAction.ConvertMp4ToGif,
      payload: this.payload,
    }
  }
}
