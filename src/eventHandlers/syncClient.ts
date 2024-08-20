import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'
import type { LockContext } from '#libs/locks/types'

export const syncClient =
  (lockContext: LockContext<UnsafeTask>) =>
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async (_, publisher) => {
    const { value: client, error: clientError } = await clientRepo.get()

    // TODO: log error.
    if (clientError) return
    if (!client.shouldSync) return

    const syncError = await lockContext(async lock =>
      lock ? await clientRepo.sync(client) : undefined
    )

    // TODO: log error.
    if (syncError) return
    await publisher.publishAll(...client.events)
  }
