import type { DomainEventHandler, DomainEventPublisher } from '#domain/eventPublisher'

class EventPublisher implements DomainEventPublisher {
  private handlerMap: Record<keyof DomainEventMap, DomainEventHandler<IDomainEvent>[]>

  constructor() {
    this.handlerMap = {} as Record<
      keyof DomainEventMap,
      DomainEventHandler<IDomainEvent>[]
    >
  }

  async publish<K extends keyof DomainEventMap>(event: DomainEventMap[K]): Promise<void> {
    if (!(event.name in this.handlerMap)) return

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

  async publishAll<K extends keyof DomainEventMap>(
    ...events: DomainEventMap[K][]
  ): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<DomainEventMap[K]>
  ): this
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<DomainEventMap[K]>[]
  ): this
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers:
      | DomainEventHandler<DomainEventMap[K]>
      | DomainEventHandler<DomainEventMap[K]>[]
  ): this {
    const isMulipleHandlers = Array.isArray(eventHandlers)
    if (eventName in this.handlerMap) {
      if (isMulipleHandlers) {
        this.handlerMap[eventName].push(
          ...(eventHandlers as DomainEventHandler<IDomainEvent>[])
        )
      } else {
        this.handlerMap[eventName].push(eventHandlers as DomainEventHandler<IDomainEvent>)
      }
      return this
    }

    this.handlerMap[eventName] = isMulipleHandlers
      ? [...(eventHandlers as DomainEventHandler<IDomainEvent>[])]
      : [eventHandlers as DomainEventHandler<IDomainEvent>]
    return this
  }

  clearHandlers<K extends keyof DomainEventMap>(eventName: K): void {
    delete this.handlerMap[eventName]
  }

  clearAllHandlers(): void {
    this.handlerMap = {} as Record<
      keyof DomainEventMap,
      DomainEventHandler<IDomainEvent>[]
    >
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
