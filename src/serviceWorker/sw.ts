/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import AlarmName from '#enums/AlarmName'
import { getEventPublisher } from '#infra/eventPublisher'
import { init as initMonitor } from '#monitor'
import { clientRepo, downloadRepo, tweetResponseCache } from '#provider'
import { getRuntimeId } from '#utils/runtime'
import handleDownloadChanged from './handlers/handleDownloadChanged'
import handleNotificationButtonClicked from './handlers/handleNotificationButtonClicked'
import handleNotificationClicked from './handlers/handleNotificationClicked'
import handleNotificationClosed from './handlers/handleNotificationClosed'
import handleRuntimeInstalled from './handlers/handleRuntimeInstalled'
import initEventPublisher from './initEventPublisher'
import { initMessageRouter } from './initMessageRouter'
import { getMessageRouter } from './messageRouter'
import { getPortRegistry } from './portRegistry'
import Browser from 'webextension-polyfill'

initMonitor({
  providers: {
    user: async () => {
      const { value: client } = await clientRepo.get()
      if (client) return { clientId: client.id.value }
    },
  },
})

const eventPublisher = getEventPublisher()
initEventPublisher(eventPublisher)

const messageRouter = getMessageRouter()
initMessageRouter(messageRouter)

const portRegistry = getPortRegistry()

Browser.runtime.onConnect.addListener(port => {
  portRegistry.register(port)
  port.onMessage.addListener((msg: unknown) => {
    messageRouter.handlePortMessage({ message: msg, port })
  })
})

Browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  messageRouter.handle({ message, sender, response: sendResponse })
  return true
})

Browser.runtime.onInstalled.addListener(handleRuntimeInstalled(eventPublisher))
Browser.downloads.onChanged.addListener(
  handleDownloadChanged(
    downloadRepo,
    new CheckDownloadWasTriggeredBySelf(getRuntimeId()),
    eventPublisher
  )
)
Browser.notifications.onClosed.addListener(
  handleNotificationClosed(eventPublisher)
)
Browser.notifications.onClicked.addListener(
  handleNotificationClicked(eventPublisher)
)
Browser.notifications.onButtonClicked.addListener(
  handleNotificationButtonClicked(eventPublisher)
)

Browser.alarms.create(AlarmName.EvictTweetCache, {
  periodInMinutes: __DEV__ ? 5 : 1440,
})
Browser.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === AlarmName.EvictTweetCache) {
    /* eslint-disable no-console */
    if (__DEV__) console.time('Evict tweet cache')
    await tweetResponseCache.evictExpired()
    if (__DEV__) console.timeEnd('Evict tweet cache')
    /* eslint-enable no-console */
  }
})
