import type { Notifications } from 'webextension-polyfill'

export interface Notifier {
  notify(
    notificationId: string | undefined,
    options: Notifications.CreateNotificationOptions
  ): Promise<string>
}
