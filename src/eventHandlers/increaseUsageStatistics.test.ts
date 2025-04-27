import Aria2DownloadIsDispatched from '#domain/events/Aria2DownloadIsDispatched'
import DownloadCompleted from '#domain/events/DownloadCompleted'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockDownloadRepo } from '#mocks/repositories/download'
import { MockUsageStatisticsRepository } from '#mocks/repositories/usageStatistics'
import { generateDownloadItem } from '#utils/test/downloadItem'
import { generateUsageStatistics } from '#utils/test/usageStatistics'
import { increaseUsageStatistics } from './increaseUsageStatistics'

describe('unit test for handler to increase usage statistics', () => {
  const downloadRepo = new MockDownloadRepo()
  const statsRepo = new MockUsageStatisticsRepository()
  const publisher = new MockEventPublisher()

  it('can increase usage statistics', async () => {
    const downloadItem = generateDownloadItem({ fileSize: 10 })
    jest
      .spyOn(downloadRepo, 'getById')
      .mockImplementation(async id => ({ ...downloadItem, id: id }))

    const stats = generateUsageStatistics()
    const mockStatsIncrease = jest.spyOn(stats, 'increase')

    const mockStatsGet = jest.spyOn(statsRepo, 'get').mockResolvedValue(stats)
    const mockStatsSave = jest.spyOn(statsRepo, 'save').mockResolvedValue()

    const handler = increaseUsageStatistics(statsRepo, downloadRepo)

    await handler(new DownloadCompleted(10), publisher)

    expect(mockStatsGet).toHaveBeenCalled()
    expect(mockStatsIncrease).toHaveBeenCalledWith({
      downloadCount: 1,
      trafficUsage: downloadItem.fileSize,
    })
    expect(mockStatsSave).toHaveBeenCalled()
    expect(mockStatsSave).not.toHaveBeenCalledWith(stats)
  })

  it('can increase only download count if event is not download event', async () => {
    const downloadItem = generateDownloadItem({
      fileSize: 10,
    })
    jest
      .spyOn(downloadRepo, 'getById')
      .mockImplementation(async id => ({ ...downloadItem, id: id }))

    const stats = generateUsageStatistics()
    const mockStatsIncrease = jest.spyOn(stats, 'increase')

    const mockStatsGet = jest.spyOn(statsRepo, 'get').mockResolvedValue(stats)
    const mockStatsSave = jest.spyOn(statsRepo, 'save').mockResolvedValue()

    const handler = increaseUsageStatistics(statsRepo, downloadRepo)

    await handler(new Aria2DownloadIsDispatched(), publisher)

    expect(mockStatsGet).toHaveBeenCalled()
    expect(mockStatsIncrease).toHaveBeenCalledWith({
      downloadCount: 1,
      trafficUsage: 0,
    })
    expect(mockStatsSave).toHaveBeenCalled()
    expect(mockStatsSave).not.toHaveBeenCalledWith(stats)
  })
})
