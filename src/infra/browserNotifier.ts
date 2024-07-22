import type { Notifier } from '#domain/notifier'
import { Notifications } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

class BrowserNotifier implements Notifier<Notifications.CreateNotificationOptions> {
  notify(options: Notifications.CreateNotificationOptions): Promise<string>
  notify(
    notificationId: string,
    options: Notifications.CreateNotificationOptions
  ): Promise<string>
  notify(...args: unknown[]): Promise<string> {
    if (args.length === 1) {
      const options = args[0] as Notifications.CreateNotificationOptions
      return Browser.notifications.create(options)
    }

    if (args.length === 2) {
      const id = args[0] as string
      const options = args[1] as Notifications.CreateNotificationOptions
      return Browser.notifications.create(id, options)
    }

    throw new Error(
      `${args.join(',')} are not valid arguments. Expect 2, got ${args.length}`
    )
  }
}

export const getNotifier = (() => {
  let instance: Notifier<Notifications.CreateNotificationOptions>
  return () => {
    if (!instance) {
      instance = new BrowserNotifier()
    }
    return instance
  }
})()
