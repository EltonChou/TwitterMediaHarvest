/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const enum WebExtAction {
  DownloadMedia = 'download-media',
  CheckDownloadHistory = 'check-download-history',
  CaptureResponse = 'capture-response',
  RequestTransactionId = 'request-tx-id',
}

export type WebExtMessageObject<
  Action extends WebExtAction | WebExtExternalAction,
> = {
  action: Action
}

export type WebExtMessagePayloadObject<
  Action extends WebExtAction | WebExtExternalAction,
  Payload extends Record<string, unknown>,
> = {
  action: Action
  payload: Payload
}

export type WebExtMessageErrorResponse = { status: 'error'; reason: string }

export type WebExtMessageResponse = { status: 'ok' }

export type WebExtMessagePayloadResponse<
  Payload extends Record<string, unknown> = never,
> = {
  status: 'ok'
  payload: Payload
}

export interface ResponsibleMessage<
  ResponsePayload extends LiteralObject = never,
  Response = keyof ResponsePayload extends string
    ? WebExtMessagePayloadResponse<ResponsePayload>
    : WebExtMessageResponse,
> {
  makeResponse(
    isOk: true,
    payload: ResponsePayload extends LiteralObject ? ResponsePayload : never
  ): Response
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
}

export interface WebExtMessage<
  Action extends WebExtAction,
  Payload extends Record<string, unknown> = never,
  ResponsePayload extends Record<string, unknown> = never,
> extends ResponsibleMessage<ResponsePayload> {
  toObject(): keyof Payload extends string
    ? WebExtMessagePayloadObject<Action, Payload>
    : WebExtMessageObject<Action>
}

export const enum WebExtExternalAction {
  Aria2Download = 'aria2-download',
}

export interface WebExtExternalMessage<
  Action extends WebExtExternalAction,
  Payload extends LiteralObject,
  _Response = never,
> {
  toObject(): WebExtMessagePayloadObject<Action, Payload>
}
