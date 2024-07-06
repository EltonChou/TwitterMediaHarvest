import DownloadCompleted from '#domain/events/DownloadCompleted'
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'
import { cleanDownloadRecord } from './cleanDownloadRecord'

it('can handle event and clean the record', async () => {
  const mockRecordRepo = new MockDownloadRecordRepo()
  const mockRemove = jest.fn()
  jest.spyOn(mockRecordRepo, 'removeById').mockImplementationOnce(mockRemove)

  const handle = cleanDownloadRecord(mockRecordRepo)
  const event = new DownloadCompleted(1)
  await handle(event)

  expect(mockRemove).toHaveBeenCalledWith(event.downloadId)
})
