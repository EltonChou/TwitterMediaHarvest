/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'
import type { LockAcquirer } from '#libs/locks/types'

export const syncClient =
  (acquireLock: LockAcquirer) =>
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async (_, publisher) => {
    let events: IDomainEvent[]
    {
      await using handle = await acquireLock()
      if (!handle.lock) return

      const { value: client, error: clientError } = await clientRepo.get()
      // eslint-disable-next-line no-console
      if (clientError) return console.error(clientError)
      if (!client.shouldSync) return

      const syncError = await clientRepo.sync(client)
      // eslint-disable-next-line no-console
      if (syncError) return console.error(syncError)

      events = client.events
    }

    // Publish outside the lock so handlers can't deadlock on it.
    await publisher.publishAll(...events)
  }
