import { toSuccessResult } from '#utils/result'
import {
  DownloadHistoryQueryResponse,
  Query,
  SearchDownloadHistoryUseCase,
} from '../../applicationUseCases/searchDownloadHistory'

export class MockSearchDownloadHistoryUseCase extends SearchDownloadHistoryUseCase {
  async searchTweetIds(_hashtags: string[]): AsyncResult<Set<string>> {
    return toSuccessResult(new Set())
  }

  async process(_query: Query): Promise<DownloadHistoryQueryResponse> {
    return {
      $metadata: {
        itemPerPage: 20,
        matchedCount: 10,
        page: { current: 1, next: null, prev: null, total: 10 },
      },
      result: {
        items: [],
        error: undefined,
      },
    }
  }
}
