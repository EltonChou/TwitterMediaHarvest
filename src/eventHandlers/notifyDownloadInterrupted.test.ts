import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import { DownloadRecordNotFound } from '#domain/repositories/downloadRecord'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import ConflictAction from '#enums/ConflictAction'
import { getNotifier } from '#infra/browserNotifier'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { notifyDownloadInterrupted } from './notifyDownloadInterrupted'
import { i18n } from 'webextension-polyfill'

afterEach(() => jest.resetAllMocks())

describe('unit test for notify download interrupted handler', () => {
  const publisher = new MockEventPublisher()

  it('can ignore user cancel event', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, 'USER_CANCELED')

    await handle(event, publisher)
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('do nothing if the record is lost', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
    jest
      .spyOn(mockRecordRepo, 'getById')
      .mockResolvedValue(toErrorResult(new DownloadRecordNotFound(1)))
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, 'NETWORK_FAILED')

    await handle(event, publisher)
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('can emit notification', async () => {
    const notifier = getNotifier()
    const mockRecordRepo = new MockDownloadRecordRepo()
    const downloadRecord = new DownloadRecord({
      downloadConfig: new DownloadConfig({
        conflictAction: ConflictAction.Overwrite,
        filename: '/usr/local/downloads/expect.jpg',
        saveAs: true,
        url: 'url',
      }),
      downloadId: 1,
      recordedAt: new Date(),
      tweetInfo: new TweetInfo({ screenName: 'name', tweetId: 'tweetId' }),
    })
    jest
      .spyOn(mockRecordRepo, 'getById')
      .mockResolvedValue(toSuccessResult(downloadRecord))
    jest.spyOn(i18n, 'getMessage').mockImplementation(msg => msg)
    const mockNotify = jest.spyOn(notifier, 'notify')

    const handle = notifyDownloadInterrupted(notifier, mockRecordRepo)
    const event = new DownloadInterrupted(1, 'NETWORK_FAILED')

    await handle(event, publisher)
    expect(mockNotify).toHaveBeenCalled()
  })
})
