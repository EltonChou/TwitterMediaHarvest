import type {
  FetchTweetSolution,
  FetchTweetSolutionCommand,
  SolutionReport,
} from '#domain/useCases/fetchTweetSolution'

export class MockFetchTweetSolution implements FetchTweetSolution {
  get events(): IDomainEvent[] {
    return []
  }

  async process(
    _command: FetchTweetSolutionCommand
  ): Promise<SolutionReport<string>> {
    throw new Error('Method not implemented')
  }
}
