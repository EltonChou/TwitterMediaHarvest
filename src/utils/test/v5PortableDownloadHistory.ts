import { V5PortableHistory } from '#domain/valueObjects/portableDownloadHistory'
import { generatePortableDownloadHistoryItem } from './v5ProtableDownloadHistoryItem'

export const generatePortableV5DownloadHistory = (itemCount: number) =>
  new V5PortableHistory({
    items: Array.from(
      { length: itemCount },
      generatePortableDownloadHistoryItem
    ),
  })
