import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import InterruptReason from '#enums/InterruptReason'
import { getNotifier } from '#infra/browserNotifier'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { notifyDownloadInterrupted } from './notifyDownloadInterrupted'

afterEach(() => jest.resetAllMocks())

describe('unit test for notify download interrupted handler', () => {
  const publisher = new MockEventPublisher()

  it('can ignore user cancel event', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, InterruptReason.UserCancel)

    await handle(event, publisher)
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('do nothing if the record is lost', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
    jest.spyOn(mockRecordRepo, 'getById').mockResolvedValue(undefined)
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, InterruptReason.NetworkFailed)

    await handle(event, publisher)
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('can emit notification', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
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
    jest.spyOn(mockRecordRepo, 'getById').mockResolvedValue(downloadRecord)
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, InterruptReason.NetworkFailed)

    await handle(event, publisher)
    expect(mockNotify).toHaveBeenCalled()
  })
})
