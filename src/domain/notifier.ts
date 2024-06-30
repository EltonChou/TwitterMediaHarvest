export interface Notifier<NotificationOptions> {
  notify(notificationId: string, options: NotificationOptions): Promise<string>
  notify(options: NotificationOptions): Promise<string>
}
