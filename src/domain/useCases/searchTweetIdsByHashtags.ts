import type { AsyncUseCase } from './base'

export type Query = {
  hashtags: Set<string>
}

export type SearchTweetIdsByHashTags = AsyncUseCase<Query, Result<Set<string>>>
