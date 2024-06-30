export type DownloadQuery = {
  id?: number
  limit?: number
}

export type DownloadItem = {
  id: number
  fileSize: number
  byExtensionId?: string
  mime?: string
}

export interface IDownloadRepository<Query = DownloadQuery, Item = DownloadItem> {
  search(query: Query): Promise<Item[]>
}
