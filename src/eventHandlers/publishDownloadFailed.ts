// SPDX-License-Identifier: MPL-2.0
import type { DomainEventHandler } from '#domain/eventPublisher'
import DownloadFailed from '#domain/events/DownloadFailed'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { topicLogger } from '#libs/loggers'

type Options = {
  ignoredReasons: ReadonlyArray<string>
}

const logger = topicLogger('publishDownloadFailed')

export const publishDownloadFailed =
  (
    downloadRecordRepo: IDownloadRecordRepository,
    options: Options
  ): DomainEventHandler<DownloadInterruptedEvent> =>
  async (event, publisher) => {
    if (options.ignoredReasons.includes(event.reason)) {
      if (__DEV__)
        logger.debug('skipped ignored reason', {
          downloadId: event.downloadId,
          reason: event.reason,
        })
      return
    }

    const { value: downloadRecord, error } = await downloadRecordRepo.getById(
      event.downloadId
    )
    if (error) {
      if (__DEV__)
        logger.debug('record lookup failed', {
          downloadId: event.downloadId,
          error,
        })
      return
    }

    await publisher.publish(
      new DownloadFailed({
        downloadId: event.downloadId,
        reason: event.reason,
        tweetInfo: downloadRecord.mapBy(props => props.tweetInfo),
        downloadConfig: downloadRecord.mapBy(props => props.downloadConfig),
      })
    )
  }
