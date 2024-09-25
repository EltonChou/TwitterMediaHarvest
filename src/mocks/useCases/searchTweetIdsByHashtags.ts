import type {
  Query,
  SearchTweetIdsByHashTags,
} from '#domain/useCases/searchTweetIdsByHashtags'

export class MockSearchTweetIdsByHashTags implements SearchTweetIdsByHashTags {
  async process(command: Query): Promise<Result<Set<string>, Error>> {
    throw new Error('Method not implemented.')
  }
}
