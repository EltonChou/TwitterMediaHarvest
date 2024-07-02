import { TweetUser } from '#domain/valueObjects/tweetUser'
import { Entity, EntityId } from './base'

export class DownloadHistoryId extends EntityId<string> {}

type DownloadHistoryMediaType = 'image' | 'video' | 'mixed'

type DownloadHistoryProps = {
  tweetUser: TweetUser
  mediaType: DownloadHistoryMediaType
  hashTags: string[]
  thumbnail?: string

  tweetTime: Date
  downloadTime: Date
}

export class DownloadHistory extends Entity<DownloadHistoryId, DownloadHistoryProps> {}
