import type {
  FetchTweetSolution,
  FetchTweetSolutionCommand,
  FetchTweetSolutionError,
} from '#domain/useCases/fetchTweetSolution'
import { Tweet } from '#domain/valueObjects/tweet'

export class MockFetchTweetSolution implements FetchTweetSolution {
  readonly isTransactionIdConsumer = false

  get events(): IDomainEvent[] {
    return []
  }

  process(
    _command: FetchTweetSolutionCommand
  ): Promise<Result<Tweet, FetchTweetSolutionError>> {
    throw new Error('Method not implemented.')
  }
}
