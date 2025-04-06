/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadFailedNotificationClosed from '#domain/events/DownloadFailedNotificationClosed'
import TweetFetchErrorNotificationClosed from '#domain/events/TweetFetchErrorNotificationClosed'
import {
  extractDownloadId,
  extractTweetId,
  isDownloadId,
  isTweetFetchId,
} from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

const handleNotificationClosed =
  (
    publisher: DomainEventPublisher
  ): ListenerOf<Notifications.Static['onClosed']> =>
  async (notificationId, _byUser) => {
    if (isTweetFetchId(notificationId)) {
      const tweetId = extractTweetId(notificationId)
      await publisher.publish(new TweetFetchErrorNotificationClosed(tweetId))
      return
    }

    if (isDownloadId(notificationId)) {
      const downloadId = extractDownloadId(notificationId)
      await publisher.publish(new DownloadFailedNotificationClosed(downloadId))
      return
    }
  }

export default handleNotificationClosed
