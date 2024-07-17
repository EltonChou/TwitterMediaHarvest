import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { faker } from '@faker-js/faker'

export class MockDownloadRecordRepo implements IDownloadRecordRepository {
  async getById(downloadItemId: number): Promise<DownloadRecord | undefined> {
    return new DownloadRecord({
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: '123' }),
      downloadConfig: new DownloadConfig({
        conflictAction: 'overwrite',
        filename: 'filename',
        saveAs: false,
        url: 'url',
      }),
    })
  }

  save(downloadRecord: DownloadRecord): Promise<void> {
    throw new Error('Method not implemented.')
  }

  removeById(downloadItemId: number): Promise<void> {
    throw new Error('Method not implemented.')
  }

  getAll(): Promise<DownloadRecord[]> {
    throw new Error('Method not implemented.')
  }
}
