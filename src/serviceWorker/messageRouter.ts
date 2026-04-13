/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
  WebExtAction,
  WebExtMessageErrorResponse,
  WebExtMessageObject,
} from '#libs/webExtMessage'
import { MessagePortName } from '#libs/webExtMessage/port'
import { getPortManager } from './portManager'
import Joi from 'joi'
import type { Runtime } from 'webextension-polyfill'

export interface MessageContext {
  message: unknown
  sender: Runtime.MessageSender
  response: (resp: unknown) => void
  port?: Runtime.Port
}

export interface WebExtMessageRouter {
  handle(ctx: MessageContext): void
  route: (
    action: WebExtAction,
    handler: MessageContextHandler,
    options?: RouteOptions
  ) => this
}

export type MessageContextHandler = (ctx: MessageContext) => Promise<void>

export type RouteOptions = {
  broadcast: MessagePortName
}

type RouteEntry = {
  handler: MessageContextHandler
  options?: RouteOptions
}

const messageSchema: Joi.ObjectSchema<WebExtMessageObject<WebExtAction>> =
  Joi.object({
    action: Joi.string().required(),
  }).unknown(true)

export const makeErrorResponse = (
  reason: string
): WebExtMessageErrorResponse => ({
  status: 'error',
  reason,
})

export class MessageRouter implements WebExtMessageRouter {
  private routeMap: Map<WebExtAction, RouteEntry>

  constructor() {
    this.routeMap = new Map()
  }

  private getEntryByAction(action: WebExtAction) {
    return this.routeMap.get(action)
  }

  async handle(ctx: MessageContext): Promise<void> {
    const { value, error } = messageSchema.validate(ctx.message)
    if (error) return ctx.response(makeErrorResponse('Invalid message.'))

    if (__DEV__)
      console.debug('[messageRouter] received message', {
        action: value.action,
        via: ctx.port ? 'port' : 'runtime',
      })

    const entry = this.getEntryByAction(value.action)

    if (!entry) {
      if (__DEV__)
        console.debug('[messageRouter] no handler for action', {
          action: value.action,
        })
      return ctx.response(
        makeErrorResponse('Invalid action' + `(action: ${value.action})`)
      )
    }

    const resolvedCtx = entry.options?.broadcast
      ? {
          ...ctx,
          response: (resp: unknown) => {
            for (const p of getPortManager().getPorts(
              entry.options!.broadcast
            )) {
              p.postMessage(resp)
            }
          },
        }
      : ctx

    return entry.handler(resolvedCtx)
  }

  async handlePortMessage({
    message,
    port,
  }: {
    message: unknown
    port: Runtime.Port
  }): Promise<void> {
    const sender: Runtime.MessageSender = port.sender ?? {}

    return this.handle({
      message,
      sender,
      response: resp => port.postMessage(resp),
      port,
    })
  }

  route(
    action: WebExtAction,
    handler: MessageContextHandler,
    options?: RouteOptions
  ): this {
    this.routeMap.set(action, { handler, options })
    return this
  }
}

export const getMessageRouter = (() => {
  let router: MessageRouter
  return () => (router ||= new MessageRouter())
})()
