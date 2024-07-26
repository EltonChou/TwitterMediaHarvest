import BrowserDownloadDispatched from '#domain/events/BrowserDownloadDispatched'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { recordDispatchedDownloadConfiguration } from '#eventHandlers/recordDispatchedDownloadConfiguration'
import { getEventPublisher } from '#infra/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'

const publisher = getEventPublisher()

const mockDownloadRecordRepo = new MockDownloadRecordRepo()

afterAll(() => publisher.clearHandlers('download:status:dispatched:browser'))
beforeAll(() =>
  publisher.register(
    'download:status:dispatched:browser',
    recordDispatchedDownloadConfiguration(mockDownloadRecordRepo)
  )
)

it('can handle download:status:dispatched:browser event', async () => {
  const mockRecordSaving = jest.spyOn(mockDownloadRecordRepo, 'save')

  const downloadConfig = new DownloadConfig({
    conflictAction: 'overwrite',
    filename: 'filename',
    saveAs: true,
    url: 'https://example.com',
  })
  const tweetInfo = new TweetInfo({ screenName: 'screen_name', tweetId: 'tweet-id' })

  const event = new BrowserDownloadDispatched({
    id: 114514,
    config: downloadConfig,
    tweetInfo: tweetInfo,
  })

  await publisher.publish(event)
  expect(mockRecordSaving).toBeCalledTimes(1)
})
