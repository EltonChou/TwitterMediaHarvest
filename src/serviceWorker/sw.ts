import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { getEventPublisher } from '#infra/eventPublisher'
import { downloadRepo } from '#provider'
import { getRuntimeId } from '#utils/runtime'
import handleDownloadChanged from './handlers/handleDownloadChanged'
import handleNotificationButtonClicked from './handlers/handleNotificationButtonClicked'
import handleNotificationClicked from './handlers/handleNotificationClicked'
import handleNotificationClosed from './handlers/handleNotificationClosed'
import handleRuntimeInstalled from './handlers/handleRuntimeInstalled'
import initEventPublisher from './initEventPublisher'
import { initMessageRouter } from './initMessageRouter'
import { getMessageRouter } from './messageRouter'
import Browser from 'webextension-polyfill'

const eventPublisher = getEventPublisher()
initEventPublisher(eventPublisher)

const messageRouter = getMessageRouter()
initMessageRouter(messageRouter)

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
Browser.notifications.onClosed.addListener(handleNotificationClosed(eventPublisher))
Browser.notifications.onClicked.addListener(handleNotificationClicked(eventPublisher))
Browser.notifications.onButtonClicked.addListener(
  handleNotificationButtonClicked(eventPublisher)
)
