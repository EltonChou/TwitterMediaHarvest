import type { Tweet } from '#domain/valueObjects/tweet'
import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import type { Factory } from './base'
import path from 'path'

export const tweetToTweetMediaFiles: Factory<Tweet, TweetMediaFile[]> = tweet => {
  const files: TweetMediaFile[] = []
  const { id: tweetId, createdAt } = tweet.mapBy(props => ({
    id: props.id,
    createdAt: props.createdAt,
  }))

  for (const media of tweet.medias) {
    const pathInfo = path.parse(media.mapBy(props => new URL(props.url).pathname))
    files.push(
      new TweetMediaFile({
        tweetId: tweetId,
        createdAt: createdAt,
        tweetUser: tweet.user,
        type: media.mapBy(props => props.type),
        source: media.getVariantUrl('orig'),
        serial: media.mapBy(props => props.index + 1),
        ext: pathInfo.ext,
        hash: pathInfo.base,
      })
    )
  }

  return files
}
