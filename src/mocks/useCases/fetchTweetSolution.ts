import type {
  FetchTweetSolution,
  FetchTweetSolutionCommand,
  FetchTweetSolutionError,
  SolutionStatistics,
} from '#domain/useCases/fetchTweetSolution'
import { Tweet } from '#domain/valueObjects/tweet'

export class MockFetchTweetSolution implements FetchTweetSolution {
  readonly isTransactionIdConsumer = false

  get events(): IDomainEvent[] {
    return []
  }

  get statistics(): SolutionStatistics<string> {
    return {}
  }

  process(
    _command: FetchTweetSolutionCommand
  ): Promise<Result<Tweet, FetchTweetSolutionError>> {
    throw new Error('Method not implemented.')
  }
}
