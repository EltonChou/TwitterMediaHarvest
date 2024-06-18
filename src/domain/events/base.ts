export abstract class DomainEvent implements IDomainEvent {
  constructor(
    readonly name: IDomainEvent['name'],
    readonly occuredAt: Date = new Date()
  ) {}
}
