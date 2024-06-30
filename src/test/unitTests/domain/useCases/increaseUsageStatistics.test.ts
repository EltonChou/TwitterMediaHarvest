import type { IUsageStatisticsRepository } from '#domain/repositories/usageStatistics'
import { IncreaseUsageStatisticsUseCase } from '#domain/useCases/increaseUsageStatistics'
import type { V4Statistics } from '#schema'

describe('unit test for usage statistic increasing use case', () => {
  class MockStatisticsRepo implements IUsageStatisticsRepository {
    async get(): Promise<V4Statistics> {
      return {
        downloadCount: 0,
        trafficUsage: 0,
      }
    }

    async save(stats: V4Statistics): Promise<void> {
      return
    }
  }

  it('can increase download usage stats', async () => {
    const mockStatsRepo = new MockStatisticsRepo()
    const useCase = new IncreaseUsageStatisticsUseCase(mockStatsRepo)

    jest
      .spyOn(mockStatsRepo, 'get')
      .mockResolvedValue({ downloadCount: 10, trafficUsage: 100 })

    const mockSaving = jest.spyOn(mockStatsRepo, 'save')

    await useCase.process({
      statsDelta: {
        downloadCount: 5,
        trafficUsage: 5000,
      },
    })

    expect(mockSaving).toBeCalledWith({ downloadCount: 15, trafficUsage: 5100 })
  })
})
