import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'

const LOCK_CRITERIA = 'client:sync'

export const syncClient =
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async (_, publisher) => {
    const { value: client, error: clientError } = await clientRepo.get()

    // TODO: log error.
    if (clientError) return
    if (!client.shouldSync) return

    const syncError = await navigator.locks.request(
      LOCK_CRITERIA,
      { ifAvailable: true },
      async lock => (lock ? await clientRepo.sync(client) : undefined)
    )

    // TODO: log error.
    if (syncError) return
    await publisher.publishAll(...client.events)
  }
