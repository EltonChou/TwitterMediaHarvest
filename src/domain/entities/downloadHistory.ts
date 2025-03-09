import { DownloadHistoryTweetUser } from '#domain/valueObjects/downloadHistoryTweetUser'
import MediaType from '#enums/mediaType'
import { Entity, EntityId } from './base'

export class DownloadHistoryId extends EntityId<string> {}

type DownloadHistoryProps = {
  tweetUser: DownloadHistoryTweetUser
  mediaType: MediaType
  hashtags: string[]
  thumbnail?: string

  tweetTime: Date
  downloadTime: Date
}

export class DownloadHistory extends Entity<
  DownloadHistoryId,
  DownloadHistoryProps
> {}
