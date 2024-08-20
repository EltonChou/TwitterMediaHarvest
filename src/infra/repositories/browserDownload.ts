import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'
import { downloads } from 'webextension-polyfill'

export class BrowserDownloadRepository implements IDownloadRepository {
  async getById(id: number): Promise<DownloadItem | undefined> {
    const [item] = await downloads.search({ id: id })
    return item
  }
  async search(query: DownloadQuery): Promise<DownloadItem[]> {
    return downloads.search(query)
  }
}
