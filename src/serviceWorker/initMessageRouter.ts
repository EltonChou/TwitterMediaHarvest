import { getEventPublisher } from '#infra/eventPublisher'
import { BrowserDownloadMediaFile } from '#infra/useCases/browserDownloadMediaFile'
import { FallbackFetchTweet } from '#infra/useCases/fallbackFetchTweet'
import { GuestFetchTweet } from '#infra/useCases/guestFetchTweet'
import { LatestFetchTweet } from '#infra/useCases/latestFetchTweet'
import { WebExtAction } from '#libs/webExtMessage'
import {
  downloadHistoryRepo,
  downloadSettingsRepo,
  featureSettingsRepo,
  filenameSettingsRepo,
  xTokenRepo,
} from '#provider'
import checkDownloadHistoryHandler from './messageHandlers/checkDownloadHistory'
import downloadMessageHandler from './messageHandlers/downloadMediaHandler'
import { type MessageRouter } from './messageRouter'

const eventPublisher = getEventPublisher()

export const initMessageRouter = (router: MessageRouter): MessageRouter =>
  router
    .route(
      WebExtAction.DownloadMedia,
      downloadMessageHandler({
        eventPublisher,
        downloadHistoryRepo,
        tokenRepo: xTokenRepo,
        downloadSettingsRepo,
        filenameSettingRepo: filenameSettingsRepo,
        featureSettingsRepo,
        downloaderBuilder: {
          // TODO: Implement aria2 download.
          aria2: params =>
            new BrowserDownloadMediaFile(
              params.targetTweet,
              params.shouldPrompt
            ),
          browser: params =>
            new BrowserDownloadMediaFile(
              params.targetTweet,
              params.shouldPrompt
            ),
        },
        fetchTweet: {
          fallback: new FallbackFetchTweet(),
          guest: new GuestFetchTweet(),
          latest: new LatestFetchTweet(),
        },
      })
    )
    .route(
      WebExtAction.CheckDownloadHistory,
      checkDownloadHistoryHandler({ downloadHistoryRepo })
    )
