// SPDX-License-Identifier: MPL-2.0
import type { DomainEventHandler } from '#domain/eventPublisher'
import { topicLogger } from '#libs/loggers'
import { DownloadTweetMediaMessage } from '#libs/webExtMessage/messages/downloadTweetMedia'

type BroadcastToContentScripts = (message: unknown) => void

const logger = topicLogger('broadcastBrowserDownloadDispatchFailed')

export const broadcastBrowserDownloadDispatchFailed =
  (
    broadcast: BroadcastToContentScripts
  ): DomainEventHandler<BrowserDownloadDispatchFailedEvent> =>
  async event => {
    if (__DEV__)
      logger.debug('broadcasting browser download dispatch failed', {
        tweetId: event.tweetInfo.tweetId,
        reason: event.reason,
      })

    const tweetId = event.tweetInfo.tweetId
    const reason =
      event.reason instanceof Error ? event.reason.message : event.reason
    broadcast(DownloadTweetMediaMessage.makeErrorResponse(tweetId, reason))
  }
