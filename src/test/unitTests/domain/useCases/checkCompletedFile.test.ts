import FilenameOverwritten from '#domain/events/FilenameOverwritten'
import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { CheckDownload } from '#domain/useCases/checkDownload'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { generateDownloadItem } from '#utils/tests/downloadItem'

class MockDownloadRepo implements IDownloadRepository {
  getById(id: number): Promise<DownloadItem | undefined> {
    throw new Error('Method not implemented.')
  }
  search(query: DownloadQuery): Promise<DownloadItem[]> {
    throw new Error('Method not implemented.')
  }
}

class MockDownloadRecordRepo implements IDownloadRecordRepository {
  getById(downloadItemId: number): Promise<DownloadRecord | null> {
    throw new Error('Method not implemented.')
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

describe('unit test for download checking use case', () => {
  const mockDownloadRepo = new MockDownloadRepo()
  const mockDownloadRecordRepo = new MockDownloadRecordRepo()

  afterEach(() => jest.restoreAllMocks())

  it('can emit FilenameOverWritten event when the final filename is modified.', async () => {
    jest
      .spyOn(mockDownloadRepo, 'getById')
      .mockResolvedValue(
        generateDownloadItem({ filename: '/usr/local/downloads/114514.jpg_orig' })
      )

    const downloadRecord = new DownloadRecord({
      downloadConfig: new DownloadConfig({
        conflictAction: 'overwrite',
        filename: '/usr/local/downloads/expect.jpg',
        saveAs: true,
        url: 'url',
      }),
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })
    jest.spyOn(mockDownloadRecordRepo, 'getById').mockResolvedValue(downloadRecord)

    const useCase = new CheckDownload(mockDownloadRepo, mockDownloadRecordRepo)
    await useCase.process({ downloadId: 1 })
    expect(useCase.events.some(e => e instanceof FilenameOverwritten)).toBeTruthy()
  })

  it('will not emit FilenameOverWritten event when the final filename is correct.', async () => {
    jest
      .spyOn(mockDownloadRepo, 'getById')
      .mockResolvedValue(
        generateDownloadItem({ filename: '/usr/local/downloads/same.jpg' })
      )

    const downloadRecord = new DownloadRecord({
      downloadConfig: new DownloadConfig({
        conflictAction: 'overwrite',
        filename: '/usr/local/downloads/same.jpg',
        saveAs: true,
        url: 'url',
      }),
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })
    jest.spyOn(mockDownloadRecordRepo, 'getById').mockResolvedValue(downloadRecord)

    const useCase = new CheckDownload(mockDownloadRepo, mockDownloadRecordRepo)
    await useCase.process({ downloadId: 1 })
    expect(useCase.events.some(e => e instanceof FilenameOverwritten)).toBeFalsy()
  })
})
