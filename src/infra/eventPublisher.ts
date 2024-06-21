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
        handle(event)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      }
    }
  }

  async publishAll<K extends keyof DomainEventMap>(
    ...events: DomainEventMap[K][]
  ): Promise<void> {
    for (const event of events) {
      this.publish(event)
    }
  }

  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandler: DomainEventHandler<DomainEventMap[K]>
  ): void {
    if (eventName in this.handlerMap) {
      this.handlerMap[eventName].push(eventHandler)
    } else {
      this.handlerMap[eventName] = [eventHandler]
    }
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
  let instance: DomainEventPublisher = undefined

  return () => {
    if (!instance) {
      instance = new EventPublisher()
    }
    return instance
  }
})()
