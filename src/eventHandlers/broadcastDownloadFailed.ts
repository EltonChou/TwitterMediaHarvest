// SPDX-License-Identifier: MPL-2.0
import type { DomainEventHandler } from '#domain/eventPublisher'
import { topicLogger } from '#libs/loggers'
import { DownloadTweetMediaMessage } from '#libs/webExtMessage/messages/downloadTweetMedia'

type BroadcastToContentScripts = (message: unknown) => void

const logger = topicLogger('broadcastDownloadFailed')

export const broadcastDownloadFailed =
  (
    broadcast: BroadcastToContentScripts
  ): DomainEventHandler<DownloadFailedEvent> =>
  async event => {
    if (__DEV__)
      logger.debug('broadcasting download failed', {
        downloadId: event.downloadId,
        reason: event.reason,
      })

    const tweetId = event.tweetInfo.tweetId
    const reason =
      event.reason instanceof Error ? event.reason.message : event.reason
    broadcast(DownloadTweetMediaMessage.makeErrorResponse(tweetId, reason))
  }
