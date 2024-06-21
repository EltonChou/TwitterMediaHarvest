import type { Notifier } from '#domain/notifier'
import { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

class BrowserNotifier implements Notifier {
  notify(
    notificationId: string,
    options: Notifications.CreateNotificationOptions
  ): Promise<string> {
    return Browser.notifications.create(notificationId, options)
  }
}

export const getNotifier = () => {
  let instance: Notifier = undefined
  return () => {
    if (!instance) {
      instance = new BrowserNotifier()
    }
    return instance
  }
}
