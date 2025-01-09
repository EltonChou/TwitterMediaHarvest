import type {
  Query,
  QueryResult,
  SearchDownloadHistory,
} from '#domain/useCases/searchDownloadHistory'

export class MockSearchDownloadHistory implements SearchDownloadHistory {
  async process(_command: Query): Promise<QueryResult> {
    throw new Error('Method not implemented.')
  }
}
