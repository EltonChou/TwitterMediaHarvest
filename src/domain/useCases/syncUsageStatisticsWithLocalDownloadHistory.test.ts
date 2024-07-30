import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
// eslint-disable-next-line max-len
import { SyncUsageStatisticsWithLocalDownloadHistory } from '#domain/useCases/syncUsageStatisticsWithLocalDownloadHistory'
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { generateDownloadItem } from '#utils/test/downloadItem'
import { CheckDownloadWasTriggeredBySelf } from './checkDownloadWasTriggeredBySelf'

describe('unit test for sync usage statistic with local download history', () => {
  const EXT_ID = 'EXT_ID'

  class MockDownloadRepository implements IDownloadRepository {
    getById(id: number): Promise<DownloadItem | undefined> {
      throw new Error('Method not implemented.')
    }

    async search(query: DownloadQuery): Promise<DownloadItem[]> {
      return []
    }
  }

  class MockUsageStatisticsRepository implements IUsageStatisticsRepository {
    async get(): Promise<UsageStatistics> {
      throw new Error('Method not implemented.')
    }

    async save(stats: UsageStatistics): Promise<void> {
      return
    }
  }

  afterAll(() => jest.resetAllMocks())

  it('can sync with download history', async () => {
    const mockUsageRepo = new MockUsageStatisticsRepository()
    const mockDownloadRepo = new MockDownloadRepository()

    jest
      .spyOn(mockUsageRepo, 'get')
      .mockResolvedValue(new UsageStatistics({ downloadCount: 1, trafficUsage: 100 }))
    const mockUsageSaving = jest.spyOn(mockUsageRepo, 'save')
    const mockDownloadSearching = jest
      .spyOn(mockDownloadRepo, 'search')
      .mockResolvedValue([
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem({
          byExtensionId: EXT_ID,
          fileSize: 3333,
          mime: 'application/json',
        }),
        generateDownloadItem({ byExtensionId: EXT_ID, fileSize: 1111 }),
        generateDownloadItem({ byExtensionId: EXT_ID, fileSize: 2222 }),
      ])

    const useCase = new SyncUsageStatisticsWithLocalDownloadHistory(
      mockUsageRepo,
      mockDownloadRepo,
      new CheckDownloadWasTriggeredBySelf(EXT_ID)
    )

    await useCase.process()
    expect(mockDownloadSearching).toHaveBeenCalled()
    expect(mockUsageSaving).toHaveBeenCalledWith(
      new UsageStatistics({ downloadCount: 2, trafficUsage: 3333 })
    )
  })
})
