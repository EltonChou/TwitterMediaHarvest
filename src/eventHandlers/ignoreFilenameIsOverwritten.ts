/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { DomainEventHandler } from '#domain/eventPublisher'
import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'

export const ignoreFilenameOverwritten =
  (
    warningSettingsRepo: IWarningSettingsRepo
  ): DomainEventHandler<IDomainEvent> =>
  async () => {
    await warningSettingsRepo.save({ ignoreFilenameOverwritten: true })
  }
