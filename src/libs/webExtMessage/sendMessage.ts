/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getAria2ExtId } from '#utils/runtime'
import {
  WebExtAction,
  WebExtExternalAction,
  WebExtExternalMessage,
  WebExtMessage,
  WebExtMessageErrorResponse,
  WebExtMessagePayloadResponse,
  WebExtMessageResponse,
} from './messages/base'
import { runtime, tabs } from 'webextension-polyfill'

export const sendMessage = async <
  Action extends WebExtAction,
  Payload extends LiteralObject = never,
  ResponsePayload extends LiteralObject = never,
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
  Action extends WebExtExternalAction,
  Payload extends LiteralObject,
  Response = never,
>(
  message: WebExtExternalMessage<Action, Payload, Response>
): Promise<Response | WebExtMessageErrorResponse> => {
  const { action, payload } = message.toObject()

  switch (action) {
    case WebExtExternalAction.Aria2Download: {
      const aria2ExtId = getAria2ExtId()
      if (!aria2ExtId) break

      return runtime.sendMessage(
        aria2ExtId,
        payload
      ) satisfies Promise<Response>
    }
  }

  return { reason: 'No target extension', status: 'error' }
}

export const sendTabMessage = (tabId: number) => {
  return async <
    Action extends WebExtAction,
    Payload extends LiteralObject = never,
    ResponsePayload extends LiteralObject = never,
  >(
    message: WebExtMessage<Action, Payload, ResponsePayload>
  ): Promise<
    | (keyof ResponsePayload extends string
        ? WebExtMessagePayloadResponse<ResponsePayload>
        : WebExtMessageResponse)
    | WebExtMessageErrorResponse
  > => tabs.sendMessage(tabId, message.toObject())
}
