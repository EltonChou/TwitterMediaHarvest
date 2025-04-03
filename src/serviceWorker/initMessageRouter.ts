import { getEventPublisher } from '#infra/eventPublisher'
import { Aria2DownloadMediaFile } from '#infra/useCases/aria2DownloadMediaFile'
import { BrowserDownloadMediaFile } from '#infra/useCases/browserDownloadMediaFile'
import { NativeFetchTweetSolution } from '#infra/useCases/nativeFetchTweetSolution'
import { WebExtAction } from '#libs/webExtMessage'
import {
  downloadHistoryRepo,
  downloadSettingsRepo,
  featureSettingsRepo,
  filenameSettingsRepo,
  solutionQuotaRepo,
  xApiClient,
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
        downloadSettingsRepo,
        filenameSettingRepo: filenameSettingsRepo,
        featureSettingsRepo,
        downloaderBuilder: {
          aria2: params => new Aria2DownloadMediaFile(params.targetTweet),
          browser: params =>
            new BrowserDownloadMediaFile(
              params.targetTweet,
              params.shouldPrompt
            ),
        },
        solutionProvider: () =>
          new NativeFetchTweetSolution(
            {
              xApiClient: xApiClient,
              xTokenRepo: xTokenRepo,
              solutionQuotaRepo: solutionQuotaRepo,
            },
            { quotaThreshold: 20 }
          ),
      })
    )
    .route(
      WebExtAction.CheckDownloadHistory,
      checkDownloadHistoryHandler({ downloadHistoryRepo })
    )
