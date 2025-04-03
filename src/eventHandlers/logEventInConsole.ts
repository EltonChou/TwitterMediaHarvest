import type { DomainEventHandler } from '#domain/eventPublisher'

/* eslint-disable no-console */
export const logEventInConsole: DomainEventHandler<IDomainEvent> = event => {
  console.group('Event received')
  console.info('Event name:', event.name)
  console.dir(event, { depth: null, colors: true })
  console.groupEnd()
}
