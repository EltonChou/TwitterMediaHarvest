export type DownloadQuery = {
  id?: number
  limit?: number
}

export type DownloadItem = {
  id: number
  filename: string
  fileSize: number
  url: string
  byExtensionId?: string
  mime?: string
}

export interface IDownloadRepository<
  Query = DownloadQuery,
  Item = DownloadItem,
> {
  getById(id: number): Promise<Item | undefined>
  search(query: Query): Promise<Item[]>
}
