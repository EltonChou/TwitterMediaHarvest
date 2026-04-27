// SPDX-License-Identifier: MPL-2.0
import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import { DownloadRecordNotFound } from '#domain/repositories/downloadRecord'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import ConflictAction from '#enums/ConflictAction'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { toErrorResult, toSuccessResult } from '#utils/result'
import { publishDownloadFailed } from './publishDownloadFailed'

afterEach(() => jest.resetAllMocks())

describe('unit test for publish download failed handler', () => {
  const makeRecord = () =>
    new DownloadRecord({
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

  it.each([
    ['USER_CANCELED', ['USER_CANCELED']],
    ['USER_SHUTDOWN', ['USER_CANCELED', 'USER_SHUTDOWN']],
  ])(
    'skips reason %s when listed in ignoredReasons',
    async (reason, ignored) => {
      const publisher = new MockEventPublisher()
      const publishSpy = jest.spyOn(publisher, 'publish')
      const mockRecordRepo = new MockDownloadRecordRepo()
      const getById = jest.spyOn(mockRecordRepo, 'getById')

      const handle = publishDownloadFailed(mockRecordRepo, {
        ignoredReasons: ignored,
      })
      await handle(new DownloadInterrupted(1, reason), publisher)

      expect(getById).not.toHaveBeenCalled()
      expect(publishSpy).not.toHaveBeenCalled()
    }
  )

  it('does nothing when the record is lost', async () => {
    const publisher = new MockEventPublisher()
    const publishSpy = jest.spyOn(publisher, 'publish')
    const mockRecordRepo = new MockDownloadRecordRepo()
    jest
      .spyOn(mockRecordRepo, 'getById')
      .mockResolvedValue(toErrorResult(new DownloadRecordNotFound(1)))

    const handle = publishDownloadFailed(mockRecordRepo, {
      ignoredReasons: [],
    })
    await handle(new DownloadInterrupted(1, 'NETWORK_FAILED'), publisher)

    expect(publishSpy).not.toHaveBeenCalled()
  })

  it('publishes DownloadFailed with record info', async () => {
    const publisher = new MockEventPublisher()
    const publishSpy = jest.spyOn(publisher, 'publish')
    const record = makeRecord()
    const mockRecordRepo = new MockDownloadRecordRepo()
    jest
      .spyOn(mockRecordRepo, 'getById')
      .mockResolvedValue(toSuccessResult(record))

    const handle = publishDownloadFailed(mockRecordRepo, {
      ignoredReasons: [],
    })
    await handle(new DownloadInterrupted(1, 'NETWORK_FAILED'), publisher)

    expect(publishSpy).toHaveBeenCalledTimes(1)
    const published = publishSpy.mock.calls[0][0] as DownloadFailedEvent
    expect(published).toMatchObject({
      name: 'download:status:failed',
      downloadId: 1,
      reason: 'NETWORK_FAILED',
    })
    expect(published.tweetInfo).toBe(record.mapBy(props => props.tweetInfo))
    expect(published.downloadConfig).toBe(
      record.mapBy(props => props.downloadConfig)
    )
  })
})
