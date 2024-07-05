import DownloadCompleted from '#domain/events/DownloadCompleted'
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { checkCompletedDownload } from '#eventHandlers/checkCompletedDownload'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRepo } from '#mocks/repositories/download'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { generateDownloadItem } from '#utils/test/downloadItem'

afterAll(() => jest.resetAllMocks())

it('can handle completed download event', async () => {
  const extensionId = 'EXT_ID'
  const publisher = new MockEventPublisher()
  const downloadRepo = new MockDownloadRepo()
  const downloadRecordRepo = new MockDownloadRecordRepo()
  const selfDownloadUseCase = new CheckDownloadWasTriggeredBySelf(extensionId)
  const event = new DownloadCompleted(1)
  const item = generateDownloadItem({
    filename: '/usr/local/downloads/114514.jpg_orig',
    byExtensionId: extensionId,
  })

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
  const handle = checkCompletedDownload(
    downloadRepo,
    downloadRecordRepo,
    selfDownloadUseCase
  )

  const mockPublish = jest.spyOn(publisher, 'publish').mockImplementationOnce(jest.fn())
  jest.spyOn(downloadRecordRepo, 'getById').mockResolvedValueOnce(downloadRecord)
  jest.spyOn(downloadRepo, 'getById').mockResolvedValueOnce(item)

  await handle(event, publisher)
  expect(mockPublish).toBeCalled()
})
