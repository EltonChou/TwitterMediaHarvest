import type { IDownloadRepository } from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
// eslint-disable-next-line max-len
import { SyncUsageStatisticsWithLocalDownloadHistory } from '#domain/useCases/syncUsageStatisticsWithLocalDownloadHistory'
import { V4Statistics } from '#schema'

describe('unit test for sync usage statistic with local download history', () => {
  const EXT_ID = 'EXT_ID'

  class MockDownloadRepository
    implements
      IDownloadRepository<
        { limit: number },
        { byExtensionId?: string; fileSize: number }
      >
  {
    async search(query: {
      limit: number
    }): Promise<{ byExtensionId?: string; fileSize: number }[]> {
      return [
        {
          fileSize: 500,
        },
        {
          fileSize: 1000,
        },
        {
          byExtensionId: EXT_ID,
          fileSize: 1111,
        },
        { byExtensionId: EXT_ID, fileSize: 2222 },
        { byExtensionId: 'OTHERS', fileSize: 10 },
      ]
    }
  }

  class MockUsageStatisticsRepository implements IUsageStatisticsRepository {
    async get(): Promise<V4Statistics> {
      return {
        downloadCount: 1,
        trafficUsage: 100,
      }
    }

    async save(stats: V4Statistics): Promise<void> {
      return
    }
  }

  it('can sync with download history', async () => {
    const mockUsageRepo = new MockUsageStatisticsRepository()
    const mockDownloadRepo = new MockDownloadRepository()

    const mockUsageSaving = jest.spyOn(mockUsageRepo, 'save')
    const mockDownloadSearching = jest.spyOn(mockDownloadRepo, 'search')

    const useCase = new SyncUsageStatisticsWithLocalDownloadHistory(
      EXT_ID,
      mockUsageRepo,
      mockDownloadRepo
    )

    await useCase.process()
    expect(mockDownloadSearching).toBeCalled()
    expect(mockUsageSaving).toBeCalledWith({ downloadCount: 2, trafficUsage: 3333 })
  })
})
