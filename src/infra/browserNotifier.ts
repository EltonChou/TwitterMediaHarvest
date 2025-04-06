/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Notifier } from '#domain/notifier'
import type { Notifications } from 'webextension-polyfill'
import { notifications } from 'webextension-polyfill'

class BrowserNotifier
  implements Notifier<Notifications.CreateNotificationOptions>
{
  notify(options: Notifications.CreateNotificationOptions): Promise<string>
  notify(
    notificationId: string,
    options: Notifications.CreateNotificationOptions
  ): Promise<string>
  notify(
    ...args:
      | [Notifications.CreateNotificationOptions]
      | [string, Notifications.CreateNotificationOptions]
  ): Promise<string> {
    if (args.length === 1) {
      const [options] = args
      return notifications.create(options)
    }

    if (args.length === 2) {
      const [id, options] = args
      return notifications.create(id, options)
    }

    throw new Error(`${args} are not valid arguments. Expect 2`)
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
