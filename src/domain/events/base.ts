export abstract class DomainEvent implements IDomainEvent {
  readonly name: IDomainEvent['name']
  readonly occuredAt: Date
  constructor(name: IDomainEvent['name']) {
    this.name = name
    this.occuredAt = new Date()
  }
}
