/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEventHandler } from '#domain/eventPublisher'
import { IClientRepository } from '#domain/repositories/client'

/* eslint-disable no-console */
export const showClientInfoInConsole =
  (clientRepo: IClientRepository): DomainEventHandler<IDomainEvent> =>
  async _event => {
    const { value: client, error } = await clientRepo.get()
    if (error) return
    console.group('Client Information')
    console.info('Client UUID:', client.id.value)
    console.groupEnd()
  }
