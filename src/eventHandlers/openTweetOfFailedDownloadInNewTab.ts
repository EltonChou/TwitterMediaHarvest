import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Factory } from '#domain/factories/base'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import type { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { tabs } from 'webextension-polyfill'

const tweetUrl = (tweetId: string) => `https://x.com/i/web/status/${tweetId}`

export const openTweetOfFailedDownloadInNewTab =
  (
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<DownloadFailedNotificationEvent> =>
  async event => {
    const { value: record, error } = await downloadRecordRepo.getById(
      event.downloadId
    )

    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return
    }

    await tabs.create({
      url: tweetUrl(recordToTweetId(record)),
    })
  }

const recordToTweetId: Factory<DownloadRecord, string> = record =>
  record.mapBy(props => props.tweetInfo.mapBy(props => props.tweetId))
