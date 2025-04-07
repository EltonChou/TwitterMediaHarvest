/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getText } from '#libs/i18n'

export class TweetNotificationButton {
  static viewTweet(): chrome.notifications.ButtonOptions {
    return {
      title: getText('View', 'notification:tweet:button'),
    }
  }
}

export class DownloadNotificationButton {
  static retryDownload(): chrome.notifications.ButtonOptions {
    return {
      title: getText('Retry', 'notification:tweet:button'),
    }
  }
}

export class FilenameNotificationButton {
  static ignore(): chrome.notifications.ButtonOptions {
    return {
      title: getText('Ignore', 'notification:filename:button'),
    }
  }
}
