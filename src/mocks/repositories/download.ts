import type {
  DownloadItem,
  DownloadQuery,
  IDownloadRepository,
} from '#domain/repositories/download'

export class MockDownloadRepo implements IDownloadRepository {
  getById(_id: number): Promise<DownloadItem | undefined> {
    throw new Error('Method not implemented.')
  }
  search(_query: DownloadQuery): Promise<DownloadItem[]> {
    throw new Error('Method not implemented.')
  }
}
