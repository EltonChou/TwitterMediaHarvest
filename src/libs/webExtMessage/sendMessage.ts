import type {
  WebExtAction,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadResponse,
  WebExtMessageResponse,
} from './messages/base'
import { runtime } from 'webextension-polyfill'

export const sendMessage = async <
  Action extends WebExtAction,
  Payload extends Record<string, unknown> = never,
  ResponsePayload extends Record<string, unknown> = never
>(
  message: WebExtMessage<Action, Payload, ResponsePayload>
): Promise<
  | (keyof ResponsePayload extends string
      ? WebExtMessagePayloadResponse<ResponsePayload>
      : WebExtMessageResponse)
  | WebExtMessageErrorResponse
> => {
  return runtime.sendMessage(message.toObject())
}

export const sendExternalMessage = async <
  Action extends WebExtAction,
  Payload extends Record<string, unknown> = never,
  ResponsePayload extends Record<string, unknown> = never
>(
  externalExtId: string,
  message: WebExtMessage<Action, Payload, ResponsePayload>
): Promise<
  | (keyof ResponsePayload extends string
      ? WebExtMessagePayloadResponse<ResponsePayload>
      : WebExtMessageResponse)
  | WebExtMessageErrorResponse
> => {
  return runtime.sendMessage(externalExtId, message.toObject())
}
