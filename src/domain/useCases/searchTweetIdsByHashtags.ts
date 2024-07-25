import type { AsyncUseCase } from './base'

export type Query = {
  hashtags: string[]
}

export type SearchTweetIdsByHashTags = AsyncUseCase<Query, Result<Set<string>>>
