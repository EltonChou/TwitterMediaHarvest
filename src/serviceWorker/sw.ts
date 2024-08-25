import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { getEventPublisher } from '#infra/eventPublisher'
import { getRuntimeId } from '#utils/runtime'
import { downloadRepo } from '../infraProvider'
import handleDownloadChanged from './handlers/handleDownloadChanged'
import handleNotificationButtonClicked from './handlers/handleNotificationButtonClicked'
import handleNotificationClicked from './handlers/handleNotificationClicked'
import handleNotificationClosed from './handlers/handleNotificationClosed'
import handleRuntimeInstalled from './handlers/handleRuntimeInstalled'
import initEventPublisher from './initEventPublisher'
import Browser from 'webextension-polyfill'

const eventPublisher = getEventPublisher()

initEventPublisher(eventPublisher)

Browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // TODO: validate message and route action
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
