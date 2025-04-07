/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'
import type { LockContext } from '#libs/locks/types'

export const syncClient =
  (lockContext: LockContext<UnsafeTask>) =>
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async (_, publisher) => {
    const syncError = await lockContext(async lock => {
      if (!lock) return undefined

      const { value: client, error: clientError } = await clientRepo.get()

      if (clientError) return clientError
      if (!client.shouldSync) return

      const syncError = await clientRepo.sync(client)
      if (syncError) return syncError

      await publisher.publishAll(...client.events)
    })

    // eslint-disable-next-line no-console
    if (syncError) console.error(syncError)
  }
