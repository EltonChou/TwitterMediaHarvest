export interface IDomainEvent {
  readonly name: string
  readonly occuredAt: Date
}

export type DomainEventHandler<T extends IDomainEvent> = (event: T) => void

export interface IDomainEventPublisher<Event extends IDomainEvent> {
  publish(event: Event): void
  publishAll(events: Event[]): void
  register(evnetName: Event['name'], eventHandler: DomainEventHandler<Event>): void
  clearHandlers(eventName: string): void
}

export abstract class DomainEvent implements IDomainEvent {
  abstract readonly name: string
  readonly occuredAt: Date

  constructor() {
    this.occuredAt = new Date()
  }
}
