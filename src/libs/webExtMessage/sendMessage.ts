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
import {
  MessagePortName,
  OneShotMessage,
  getMessagePort,
  isOneShotMessage,
} from './port'
import { runtime, tabs } from 'webextension-polyfill'

/**
 * Sends a fire-and-forget message to the background script via a long-lived port.
 */
export function sendMessage<
  Action extends WebExtAction,
  Payload extends LiteralObject = never,
  ResponsePayload extends LiteralObject = never,
>(message: WebExtMessage<Action, Payload, ResponsePayload>): Promise<void>

/**
 * Sends a one-shot request via a long-lived port and awaits a typed response.
 */
export function sendMessage<
  Action extends WebExtAction,
  Payload extends LiteralObject = never,
  ResponsePayload extends LiteralObject = never,
>(
  message: OneShotMessage<WebExtMessage<Action, Payload, ResponsePayload>>
): Promise<
  | (keyof ResponsePayload extends string
      ? WebExtMessagePayloadResponse<ResponsePayload>
      : WebExtMessageResponse)
  | WebExtMessageErrorResponse
>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sendMessage(message: any): Promise<any> {
  if (isOneShotMessage(message)) {
    const { inner } = message as OneShotMessage<WebExtMessage<WebExtAction>>
    return runtime.sendMessage(inner.toObject())
  }

  const port = getMessagePort(MessagePortName.ContentScript)
  port.postMessage((message as WebExtMessage<WebExtAction>).toObject())
  return Promise.resolve()
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
