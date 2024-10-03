import {
  WebExtAction,
  WebExtMessageErrorResponse,
  WebExtMessageObject,
} from '#libs/webExtMessage'
import Joi from 'joi'
import type { Runtime } from 'webextension-polyfill'

export interface MessageContext {
  message: unknown
  sender: Runtime.MessageSender
  response: (resp: unknown) => void
}

export interface WebExtMessageRouter {
  handle(ctx: MessageContext): void
  route: (action: WebExtAction, handler: MessageContextHandler) => this
}

export type MessageContextHandler = (ctx: MessageContext) => Promise<void>

const messageSchema: Joi.ObjectSchema<WebExtMessageObject<WebExtAction>> = Joi.object({
  action: Joi.string().required(),
})

export const makeErrorResponse = (reason: string): WebExtMessageErrorResponse => ({
  status: 'error',
  reason,
})

export class MessageRouter implements WebExtMessageRouter {
  private routeMap: Map<WebExtAction, MessageContextHandler>

  constructor() {
    this.routeMap = new Map()
  }

  private getHandlerByAction(action: WebExtAction) {
    return this.routeMap.get(action)
  }

  async handle(ctx: MessageContext): Promise<void> {
    const { value, error } = messageSchema.validate(ctx.message)
    if (error) return ctx.response(makeErrorResponse('Invalid message.'))

    const handler = this.getHandlerByAction(value.action)

    return handler
      ? handler(ctx)
      : ctx.response(makeErrorResponse('Invalid action' + `(action: ${value.action})`))
  }

  route(action: WebExtAction, handler: MessageContextHandler): this {
    this.routeMap.set(action, handler)
    return this
  }
}

export const getMessageRouter = (() => {
  let router: MessageRouter
  return () => (router ||= new MessageRouter())
})()
