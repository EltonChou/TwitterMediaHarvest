import MediaType from '#enums/mediaType'
import { ValueObject } from './base'

type V5PortableDownloadHistoryItemProps = {
  tweetId: string
  screenName: string
  displayName: string
  tweetTime: Date
  downloadTime: Date
  mediaType: MediaType
  thumbnail: string
  userId: string
  hashtags: string[]
}

export class V5PortableDownloadHistoryItem extends ValueObject<V5PortableDownloadHistoryItemProps> {}
