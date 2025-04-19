/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type {
  DomainEventHandler,
  DomainEventPublisher,
} from '#domain/eventPublisher'

class EventPublisher implements DomainEventPublisher {
  private handlerMap: Record<string, DomainEventHandler<IDomainEvent>[]>

  constructor() {
    this.handlerMap = {} satisfies Record<
      string,
      DomainEventHandler<IDomainEvent>[]
    >
  }

  /* eslint-disable no-console */
  async publish(event: IDomainEvent): Promise<void> {
    if (!(event.name in this.handlerMap)) {
      console.info(`[${event.name}]: no handler to handle`)
      return
    }

    for (const handle of this.handlerMap[event.name]) {
      try {
        await handle(event, this)
      } catch (error) {
        console.info(`[${event.name}]: failed to handle`)

        console.error(error)
      }
    }
  }

  async publishAll(...events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }
  /* eslint-enable no-console */

  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers:
      | DomainEventHandler<IDomainEvent>
      | DomainEventHandler<IDomainEvent>[]
  ): this {
    const handlers = Array.isArray(eventHandlers)
      ? [...eventHandlers]
      : [eventHandlers]

    if (__DEV__) handlers.push(logEventInConsole)

    if (eventName in this.handlerMap) {
      this.handlerMap[eventName].push(...handlers)
      return this
    }

    this.handlerMap[eventName] = handlers
    return this
  }

  clearHandlers<K extends keyof DomainEventMap>(eventName: K): void {
    delete this.handlerMap[eventName]
  }

  clearAllHandlers(): void {
    this.handlerMap = Object.create({})
  }
}

export const getEventPublisher = (() => {
  let instance: DomainEventPublisher

  return () => {
    if (!instance) {
      instance = new EventPublisher()
    }
    return instance
  }
})()

/* eslint-disable no-console */
const logEventInConsole: DomainEventHandler<IDomainEvent> = event => {
  console.group('Event received')
  console.info('Event name:', event.name)
  console.dir(event, { depth: null, colors: true })
  console.groupEnd()
}
/* eslint-enable no-console */
