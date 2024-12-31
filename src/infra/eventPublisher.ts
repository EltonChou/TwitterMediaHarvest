import type { DomainEventHandler, DomainEventPublisher } from '#domain/eventPublisher'

class EventPublisher implements DomainEventPublisher {
  private handlerMap: Record<string, DomainEventHandler<IDomainEvent>[]>

  constructor() {
    this.handlerMap = {} satisfies Record<string, DomainEventHandler<IDomainEvent>[]>
  }

  async publish(event: IDomainEvent): Promise<void> {
    if (!(event.name in this.handlerMap)) {
      // eslint-disable-next-line no-console
      console.info(`No handlers for ${event.name}`)
      return
    }

    for (const handle of this.handlerMap[event.name]) {
      try {
        // eslint-disable-next-line no-console
        console.info(`Handle ${event.name}.`)
        await handle(event, this)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.info(`Failed to handle ${event.name}.`)
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async publishAll(...events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<IDomainEvent> | DomainEventHandler<IDomainEvent>[]
  ): this {
    const isMulipleHandlers = Array.isArray(eventHandlers)
    if (eventName in this.handlerMap) {
      if (isMulipleHandlers) {
        this.handlerMap[eventName].push(...eventHandlers)
      } else {
        this.handlerMap[eventName].push(eventHandlers)
      }
      return this
    }

    this.handlerMap[eventName] = isMulipleHandlers ? [...eventHandlers] : [eventHandlers]
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
