export type DomainEventHandler<E> = (event: E) => Promise<void> | void

export interface DomainEventPublisher<EventMap extends DomainEventMap = DomainEventMap> {
  publish<K extends keyof EventMap>(event: EventMap[K]): Promise<void>
  publishAll<K extends keyof EventMap>(...events: EventMap[K][]): Promise<void>
  register<K extends keyof EventMap>(
    eventName: K,
    eventHandler: DomainEventHandler<EventMap[K]>
  ): void
  clearHandlers<K extends keyof EventMap>(eventName: K): void
  clearAllHandlers(): void
}