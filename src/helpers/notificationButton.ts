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
