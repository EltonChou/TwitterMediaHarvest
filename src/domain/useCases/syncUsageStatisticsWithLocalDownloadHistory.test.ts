import { SyncUsageStatisticsWithLocalDownloadHistory } from '#domain/useCases/syncUsageStatisticsWithLocalDownloadHistory'
import { UsageStatistics } from '#domain/valueObjects/usageStatistics'
import { MockDownloadRepo } from '#mocks/repositories/download'
import { MockUsageStatisticsRepository } from '#mocks/repositories/usageStatistics'
import { generateDownloadItem } from '#utils/test/downloadItem'
import { CheckDownloadWasTriggeredBySelf } from './checkDownloadWasTriggeredBySelf'

describe('unit test for sync usage statistic with local download history', () => {
  const EXT_ID = 'EXT_ID'

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  afterAll(() => jest.resetAllMocks())

  /**
   *  FIXME: **NEED TRIAGE** This test result is not consistent.
   */
  it('can sync with download history', async () => {
    const mockUsageRepo = new MockUsageStatisticsRepository()
    const mockDownloadRepo = new MockDownloadRepo()

    jest
      .spyOn(mockUsageRepo, 'get')
      .mockResolvedValue(
        new UsageStatistics({ downloadCount: 1, trafficUsage: 100 })
      )
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
