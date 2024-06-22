export type DomainEventHandler<E> = (
  event: E,
  publisher: DomainEventPublisher
) => Promise<void> | void

export interface DomainEventPublisher<EventMap extends DomainEventMap = DomainEventMap> {
  publish<K extends keyof EventMap>(event: EventMap[K]): Promise<void>
  publishAll<K extends keyof EventMap>(...events: EventMap[K][]): Promise<void>
  register<K extends keyof EventMap>(
    eventName: K,
    eventHandlers: DomainEventHandler<EventMap[K]> | DomainEventHandler<EventMap[K]>[]
  ): this
  clearHandlers<K extends keyof EventMap>(eventName: K): void
  clearAllHandlers(): void
}
