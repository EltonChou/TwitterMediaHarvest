import type { IDownloadRepository } from '#domain/repositories/download'
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'

describe('unit test for chek download was triggered by self', () => {
  const EXT_ID = 'EXT_ID'

  class MockDownloadRepository
    implements
      IDownloadRepository<{ id: number }, { byExtensionId?: string; mime?: string }>
  {
    async search(query: {
      id: number
    }): Promise<{ byExtensionId?: string; mime?: string }[]> {
      return []
    }
  }

  it('can check the download was triggered by self or not', async () => {
    const downloadId = 114514
    const mockDownloadRepo = new MockDownloadRepository()
    const useCase = new CheckDownloadWasTriggeredBySelf(EXT_ID, mockDownloadRepo)

    jest.spyOn(mockDownloadRepo, 'search').mockResolvedValue([
      {
        byExtensionId: EXT_ID,
        mime: 'image/png',
      },
    ])
    const isDownloadBySelf = await useCase.process({ downloadId })
    expect(isDownloadBySelf).toBeTruthy()

    jest.spyOn(mockDownloadRepo, 'search').mockResolvedValue([
      {
        byExtensionId: EXT_ID,
        mime: 'application/json',
      },
    ])
    const isNotDownloadBySelf = !(await useCase.process({ downloadId }))
    expect(isNotDownloadBySelf).toBeTruthy()
  })
})
