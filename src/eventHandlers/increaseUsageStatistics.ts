import { DomainEventHandler } from '#domain/eventPublisher'
import { IDownloadRepository } from '#domain/repositories/download'
import { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'

export const increaseUsageStatistics =
  (
    statsRepo: IUsageStatisticsRepository,
    downloadRepo: IDownloadRepository
  ): DomainEventHandler<DownloadEvent | IDomainEvent> =>
  async event => {
    if (assertDownloadEvent(event)) {
      const item = await downloadRepo.getById(event.downloadId)
      const stats = await statsRepo.get()
      const newStats = stats.increase({
        downloadCount: 1,
        trafficUsage: item ? item.fileSize : 0,
      })
      await statsRepo.save(newStats)
    } else {
      const stats = await statsRepo.get()
      const newStats = stats.increase({
        downloadCount: 1,
        trafficUsage: 0,
      })
      await statsRepo.save(newStats)
    }
  }

const assertDownloadEvent: Assert<IDomainEvent, DownloadEvent> = (
  event
): event is DownloadEvent => Object.hasOwn(event, 'downloadId')
