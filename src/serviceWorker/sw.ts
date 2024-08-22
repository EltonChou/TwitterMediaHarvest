import DownloadCompleted from '#domain/events/DownloadCompleted'
import RuntimeInstalled from '#domain/events/RuntimeInstalled'
import RuntimeUpdated from '#domain/events/RuntimeUpdated'
import { getEventPublisher } from '#infra/eventPublisher'
import Browser from 'webextension-polyfill'

const eventPublisher = getEventPublisher()

Browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // TODO: action router
})

Browser.runtime.onInstalled.addListener(async details => {
  const currentVersion = Browser.runtime.getManifest().version

  if (details.reason === 'browser_update') return

  if (details.reason === 'install') {
    await eventPublisher.publish(new RuntimeInstalled(currentVersion))
  }

  if (details.reason === 'update') {
    await eventPublisher.publish(
      new RuntimeUpdated({
        current: currentVersion,
        previous: details.previousVersion ?? currentVersion,
      })
    )
  }
})

Browser.downloads.onChanged.addListener(async downloadDelta => {
  // Only focus on state.
  if ('state' in downloadDelta) {
    // TODO: Check is triggered by self.

    await eventPublisher.publish(new DownloadCompleted(downloadDelta.id))
  }
})

Browser.notifications.onClosed.addListener(notifficationId => {
  //TODO: Check notification type.
})

Browser.notifications.onClicked.addListener(notifficationId => {
  //TODO: Check notification type.
})

Browser.notifications.onButtonClicked.addListener((notifficationId, buttonIndex) => {
  //TODO: Check notification type.
})
