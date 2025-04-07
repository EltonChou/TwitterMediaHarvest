/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { IClientRepository } from '#domain/repositories/client'

export const initClient =
  (
    clientRepo: IClientRepository,
    setUninstallURL: (url: string) => Promise<void>
  ): DomainEventHandler<DomainEventMap['runtime:status:installed']> =>
  async () => {
    const { value: client, error: clientError } = await clientRepo.get()

    if (clientError) {
      // eslint-disable-next-line no-console
      console.error(clientError)
      return
    }

    await setUninstallURL(client.uninstallUrl)
  }
