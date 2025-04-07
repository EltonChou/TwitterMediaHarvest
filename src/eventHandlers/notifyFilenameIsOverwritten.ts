/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import type { ISettingsRepository } from '#domain/repositories/settings'
import { makeFilenameIsOverwrittenNotificationConfig } from '#helpers/notificationConfig'
import { makeFilenameNotificationId } from '#helpers/notificationId'
import type { WarningSettings } from '#schema'
import type { Notifications } from 'webextension-polyfill'

export const notifyFilenameIsOverwritten =
  (
    notifier: Notifier<Notifications.CreateNotificationOptions>,
    warningSettingsRepo: ISettingsRepository<WarningSettings>
  ): DomainEventHandler<FilenameOverwrittenEvent> =>
  async event => {
    const { ignoreFilenameOverwritten } = await warningSettingsRepo.get()
    if (ignoreFilenameOverwritten) return

    const notificationConfig =
      makeFilenameIsOverwrittenNotificationConfig(event)
    await notifier.notify(makeFilenameNotificationId(), notificationConfig)
  }
