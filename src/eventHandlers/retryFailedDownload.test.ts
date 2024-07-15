import DownloadFailedNotificationRetryButtonClicked from '#domain/events/DownloadFailedNotificationRetryButtonClicked'
import { getEventPublisher } from '#infra/eventPublisher'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { MockDownloadSettingsRepository } from '#mocks/repositories/downloadSettings'
import { MockDownloadMediaFile } from '#mocks/useCases/downloadMediaFile'
import { retryFailedDownload } from './retryFailedDownload'

test('hanlder to retry failed download', async () => {
  const downloadSettingsRepo = new MockDownloadSettingsRepository()
  const downloadRecordRepo = new MockDownloadRecordRepo()
  const downloadMediaFile = new MockDownloadMediaFile()
  const downloaderBuilder = () => downloadMediaFile
  const publisher = getEventPublisher()

  const handle = retryFailedDownload(
    downloadSettingsRepo,
    downloadRecordRepo,
    downloaderBuilder
  )

  jest.spyOn(downloadSettingsRepo, 'get').mockResolvedValueOnce({
    askWhereToSave: false,
    enableAria2: false,
    aggressiveMode: false,
  })

  const mockDownload = jest
    .spyOn(downloadMediaFile, 'process')
    .mockImplementation(jest.fn())

  const event = new DownloadFailedNotificationRetryButtonClicked(1)
  await handle(event, publisher)
  expect(mockDownload).toHaveBeenCalled()
  mockDownload.mockClear()
})
