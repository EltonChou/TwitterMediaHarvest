/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
  tweetResponseCache,
  xApiClient,
  xTokenRepo,
} from '#provider'
import captureResponseHandler from './messageHandlers/captureResponse'
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
            { quotaThreshold: 10, reservedQuota: 10 }
          ),
      })
    )
    .route(
      WebExtAction.CheckDownloadHistory,
      checkDownloadHistoryHandler({ downloadHistoryRepo })
    )
    .route(
      WebExtAction.CaptureResponse,
      captureResponseHandler({ tweetResponseCache })
    )
