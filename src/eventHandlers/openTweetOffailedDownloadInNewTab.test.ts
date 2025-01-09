import DownloadFailedNotificationViewButtonClicked from '#domain/events/DownloadFailedNotificationViewButtonClicked'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { toSuccessResult } from '#utils/result'
import { generateDownloadRecord } from '#utils/test/downloadRecord'
import { openTweetOfFailedDownloadInNewTab } from './openTweetOfFailedDownloadInNewTab'
import { tabs } from 'webextension-polyfill'

describe('unit test for handler to open tweet of failed download in new tab', () => {
  const recordRepo = new MockDownloadRecordRepo()
  const publisher = new MockEventPublisher()

  it('can handle download failed notification event', async () => {
    jest
      .spyOn(recordRepo, 'getById')
      .mockResolvedValue(toSuccessResult(generateDownloadRecord()))
    const mockCreateTab = jest.spyOn(tabs, 'create')
    const handler = openTweetOfFailedDownloadInNewTab(recordRepo)
    await handler(
      new DownloadFailedNotificationViewButtonClicked(10),
      publisher
    )

    expect(mockCreateTab).toHaveBeenCalled()
  })
})
