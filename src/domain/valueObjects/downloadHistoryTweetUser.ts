import { ValueObject } from './base'

export type DownloadHistoryTweetUserProps = {
  userId: string
  displayName: string
  screenName: string
}

export class DownloadHistoryTweetUser extends ValueObject<DownloadHistoryTweetUserProps> {}
