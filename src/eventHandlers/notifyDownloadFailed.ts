// SPDX-License-Identifier: MPL-2.0
import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import { MediaDownloadNotificationConfig } from '#helpers/notificationConfig'
import { makeDownloadFailedNotificationId } from '#helpers/notificationId'
import { topicLogger } from '#libs/loggers'
import type { Notifications } from 'webextension-polyfill'

const logger = topicLogger('notifyDownloadFailed')

export const notifyDownloadFailed =
  (
    notifier: Notifier<Notifications.CreateNotificationOptions>
  ): DomainEventHandler<DownloadFailedEvent> =>
  async event => {
    if (__DEV__)
      logger.debug('download failed', {
        downloadId: event.downloadId,
        reason: event.reason,
      })

    const tweetInfo = event.tweetInfo.mapBy(props => props)
    const notificationConfig = MediaDownloadNotificationConfig.error(
      tweetInfo,
      event.occuredAt
    )

    await notifier.notify(
      makeDownloadFailedNotificationId(event.downloadId),
      notificationConfig
    )
  }
