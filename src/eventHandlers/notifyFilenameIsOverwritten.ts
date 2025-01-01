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

    const notificationConfig = makeFilenameIsOverwrittenNotificationConfig(event)
    await notifier.notify(makeFilenameNotificationId(), notificationConfig)
  }
