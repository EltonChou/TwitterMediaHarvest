export interface IDownloadRepository<Query, DownloadItem> {
  search(query: Query): Promise<DownloadItem[]>
}
