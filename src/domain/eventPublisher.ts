export interface DomainEventHandler<E> {
  (event: E, publisher: EventPublisher): Promise<unknown> | unknown
}

export interface EventPublisher<E = IDomainEvent> {
  publish(event: E): Promise<void>
  publishAll(...events: E[]): Promise<void>
}

export interface DomainEventPublisher<EventMap extends DomainEventMap = DomainEventMap>
  extends EventPublisher {
  register<K extends keyof EventMap>(
    eventName: K,
    eventHandler: DomainEventHandler<EventMap[K]>
  ): this
  register<K extends keyof EventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<EventMap[K]>[]
  ): this

  clearHandlers(eventName: keyof EventMap): void
  clearAllHandlers(): void
}
