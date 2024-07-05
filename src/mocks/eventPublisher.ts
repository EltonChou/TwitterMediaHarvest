import type { DomainEventHandler, DomainEventPublisher } from '#domain/eventPublisher'

export class MockEventPublisher implements DomainEventPublisher {
  publish<K extends keyof DomainEventMap>(event: DomainEventMap[K]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  publishAll<K extends keyof DomainEventMap>(
    ...events: DomainEventMap[K][]
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandler: DomainEventHandler<DomainEventMap[K]>
  ): this
  register<K extends keyof DomainEventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<DomainEventMap[K]>[]
  ): this
  register(eventName: unknown, eventHandlers: unknown): this {
    throw new Error('Method not implemented.')
  }
  clearHandlers<K extends keyof DomainEventMap>(eventName: K): void {
    throw new Error('Method not implemented.')
  }
  clearAllHandlers(): void {
    throw new Error('Method not implemented.')
  }
}
