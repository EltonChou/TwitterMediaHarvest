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

export type WebExtMessageErrorResponse<
  Action extends WebExtAction | WebExtExternalAction = never,
  Extra extends Record<string, unknown> = Record<never, never>,
> = [Action] extends [never]
  ? { status: 'error'; reason: string } & Extra
  : { action: Action; status: 'error'; reason: string } & Extra

export type WebExtMessageResponse<
  Action extends WebExtAction | WebExtExternalAction = never,
> = [Action] extends [never]
  ? { status: 'ok' }
  : { action: Action; status: 'ok' }

export type WebExtMessagePayloadResponse<
  Payload extends Record<string, unknown> = never,
  Action extends WebExtAction | WebExtExternalAction = never,
> = [Action] extends [never]
  ? { status: 'ok'; payload: Payload }
  : { action: Action; status: 'ok'; payload: Payload }

export interface ResponsibleMessage<
  Action extends WebExtAction | WebExtExternalAction,
  ResponsePayload extends LiteralObject = never,
  Response = keyof ResponsePayload extends string
    ? WebExtMessagePayloadResponse<ResponsePayload, Action>
    : WebExtMessageResponse<Action>,
> {
  makeResponse(
    isOk: true,
    payload: ResponsePayload extends LiteralObject ? ResponsePayload : never
  ): Response
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse<Action>
}

export interface WebExtMessage<
  Action extends WebExtAction,
  Payload extends Record<string, unknown> = never,
  ResponsePayload extends Record<string, unknown> = never,
> extends ResponsibleMessage<Action, ResponsePayload> {
  toObject(): keyof Payload extends string
    ? WebExtMessagePayloadObject<Action, Payload>
    : WebExtMessageObject<Action>
  asOneShot(): import('../port').OneShotMessage<this>
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
