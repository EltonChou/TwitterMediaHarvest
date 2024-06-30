import type { Notifier } from '#domain/notifier'
import { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

class BrowserNotifier implements Notifier<Notifications.CreateNotificationOptions> {
  notify(
    notificationId: string,
    options: Notifications.CreateNotificationOptions
  ): Promise<string>
  notify(options: Notifications.CreateNotificationOptions): Promise<string>
  notify(notificationId: unknown, options?: unknown): Promise<string> {
    if (options !== undefined) {
      return Browser.notifications.create(
        options as Notifications.CreateNotificationOptions
      )
    }

    if (notificationId && options) {
      return Browser.notifications.create(
        notificationId as string,
        options as Notifications.CreateNotificationOptions
      )
    }
  }
}

export const getNotifier = () => {
  let instance: Notifier<Notifications.CreateNotificationOptions> = undefined
  return () => {
    if (!instance) {
      instance = new BrowserNotifier()
    }
    return instance
  }
}
