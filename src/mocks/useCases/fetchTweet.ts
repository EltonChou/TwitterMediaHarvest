import type {
  FetchTweet,
  FetchTweetCommand,
  TweetResult,
} from '#domain/useCases/fetchTweet'

export class MockFetchTweet implements FetchTweet {
  readonly identity: string = 'mock'

  async process(command: FetchTweetCommand): Promise<TweetResult> {
    throw new Error('Method not implemented.')
  }
}
