import type {
  DomainEventHandler,
  DomainEventPublisher,
} from '#domain/eventPublisher'

export class MockEventPublisher implements DomainEventPublisher {
  publish<K extends keyof DomainEventMap>(
    _event: DomainEventMap[K]
  ): Promise<void> {
    return Promise.resolve()
  }
  publishAll<K extends keyof DomainEventMap>(
    ..._events: DomainEventMap[K][]
  ): Promise<void> {
    return Promise.resolve()
  }
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandler: DomainEventHandler<DomainEventMap[K]>
  ): this
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<DomainEventMap[K]>[]
  ): this
  register(_eventName: unknown, _eventHandlers: unknown): this {
    return this
  }
  clearHandlers<K extends keyof DomainEventMap>(_eventName: K): void {
    return
  }
  clearAllHandlers(): void {
    return
  }
}
