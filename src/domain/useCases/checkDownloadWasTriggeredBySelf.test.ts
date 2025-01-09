import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { generateDownloadItem } from '#utils/test/downloadItem'

describe('unit test for chek download was triggered by self', () => {
  const EXT_ID = 'EXT_ID'

  it('can check the download was triggered by self or not', async () => {
    const useCase = new CheckDownloadWasTriggeredBySelf(EXT_ID)

    const correctItem = generateDownloadItem({
      byExtensionId: EXT_ID,
      mime: 'image/png',
    })
    const isDownloadBySelf = useCase.process({ item: correctItem })
    expect(isDownloadBySelf).toBeTruthy()

    const othersItem = generateDownloadItem({
      byExtensionId: EXT_ID,
      mime: 'application/json',
    })
    const isNotDownloadBySelf = useCase.process({ item: othersItem })
    expect(isNotDownloadBySelf).not.toBeTruthy()
  })
})
