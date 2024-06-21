import { i18nLocalize } from '#libs/i18n'

export class TweetNotificationButton {
  static viewTweet(): chrome.notifications.ButtonOptions {
    return {
      title: i18nLocalize('notificationDLFailedButton1'),
    }
  }
}

export class DownloadNotificationButton {
  static retryDownload(): chrome.notifications.ButtonOptions {
    return {
      title: i18nLocalize('notificationDLFailedButton2'),
    }
  }
}
