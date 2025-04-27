import type { DownloadItem } from '#domain/repositories/download'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadItem = (
  item?: Partial<DownloadItem>
): DownloadItem => {
  return {
    id: item?.id ?? faker.number.int(),
    fileSize: item?.fileSize ?? faker.number.int(),
    url: item?.url ?? faker.internet.url(),
    mime: item?.mime ?? faker.system.mimeType(),
    byExtensionId:
      item?.byExtensionId ?? faker.string.alphanumeric({ length: 32 }),
    filename: item?.filename ?? faker.system.filePath(),
  }
}
