import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'
import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
// eslint-disable-next-line max-len
import { SyncUsageStatisticsWithLocalDownloadHistory } from '#domain/useCases/syncUsageStatisticsWithLocalDownloadHistory'
import { V4Statistics } from '#schema'
import { generateDownloadItem } from '#utils/tests/downloadItem'

describe('unit test for sync usage statistic with local download history', () => {
  const EXT_ID = 'EXT_ID'

  class MockDownloadRepository implements IDownloadRepository {
    async search(query: DownloadQuery): Promise<DownloadItem[]> {
      return []
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

  afterAll(() => jest.resetAllMocks())

  it('can sync with download history', async () => {
    const mockUsageRepo = new MockUsageStatisticsRepository()
    const mockDownloadRepo = new MockDownloadRepository()

    const mockUsageSaving = jest.spyOn(mockUsageRepo, 'save')
    const mockDownloadSearching = jest
      .spyOn(mockDownloadRepo, 'search')
      .mockResolvedValue([
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem(),
        generateDownloadItem({ byExtensionId: EXT_ID, fileSize: 1111 }),
        generateDownloadItem({ byExtensionId: EXT_ID, fileSize: 2222 }),
      ])

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
