export const enum WebExtAction {
  DownloadMedia = 'download-media',
  CheckDownloadHistory = 'check-download-history',
}

export type WebExtMessageObject<Action extends WebExtAction> = {
  action: Action
}

export type WebExtMessagePayloadObject<
  Action extends WebExtAction,
  Payload extends Record<string, unknown>
> = {
  action: Action
  payload: Payload
}

export type WebExtMessageErrorResponse = { status: 'error'; reason: string }

export type WebExtMessageResponse = { status: 'ok' }

export type WebExtMessagePayloadResponse<Payload extends Record<string, unknown>> = {
  status: 'ok'
  payload: Payload
}

export interface WebExtMessage<
  Action extends WebExtAction,
  Payload extends Record<string, unknown> = never,
  ResponsePayload extends Record<string, unknown> = never,
  MessageObject = keyof Payload extends string
    ? WebExtMessagePayloadObject<Action, Payload>
    : WebExtMessageObject<Action>,
  Response = keyof ResponsePayload extends string
    ? WebExtMessagePayloadResponse<ResponsePayload>
    : WebExtMessageResponse
> {
  toObject(): MessageObject
  makeResponse(isOk: true, payload: ResponsePayload): Response
  makeResponse(isOk: false, reason: string): WebExtMessageErrorResponse
}