import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { generateDownloadItem } from '#utils/test/downloadItem'

describe('unit test for chek download was triggered by self', () => {
  const EXT_ID = 'EXT_ID'

  it.each([
    {
      item: generateDownloadItem({
        byExtensionId: EXT_ID,
        mime: 'image/png',
      }),
      allowJSON: false,
      expected: true,
    },
    {
      item: generateDownloadItem({
        byExtensionId: EXT_ID,
        mime: 'application/json',
      }),
      allowJSON: false,
      expected: false,
    },
    {
      item: generateDownloadItem({
        byExtensionId: EXT_ID,
        mime: 'application/json',
      }),
      allowJSON: true,
      expected: true,
    },
    {
      item: generateDownloadItem({
        byExtensionId: 'OTHER_EXT_ID',
        mime: 'application/json',
      }),
      allowJSON: true,
      expected: false,
    },
    {
      item: generateDownloadItem({
        byExtensionId: 'OTHER_EXT_ID',
        mime: 'image/jpeg',
      }),
      allowJSON: false,
      expected: false,
    },
  ])(
    'can check the download item (mime: $item.mime) was triggered by self or not (allowJSON: $allowJSON)',
    async ({ item, allowJSON, expected }) => {
      const useCase = new CheckDownloadWasTriggeredBySelf(EXT_ID)

      const isDownloadBySelf = useCase.process({ item, allowJSON })
      expect(isDownloadBySelf).toBe(expected)
    }
  )
})
