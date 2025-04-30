/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { PropsOf } from '#domain/valueObjects/base'
import type { Tweet } from '#domain/valueObjects/tweet'
import type { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import type { Factory } from './base'
import path from 'path'

export const tweetToTweetMediaFiles: Factory<
  Tweet,
  TweetMediaFile[]
> = tweet => {
  const mediaToTweetMediaFile = mediaFromTweetToTweetMediaFile(tweet)
  return tweet.medias.map(mediaToTweetMediaFile)
}

const mediaFromTweetToTweetMediaFile = (
  tweet: Tweet
): Factory<TweetMedia, TweetMediaFile> => {
  const { id: tweetId, createdAt } = tweet.mapBy(props => ({
    id: props.id,
    createdAt: props.createdAt,
  }))

  return tweetMedia => {
    const pathInfo = mediaToParsedPath(tweetMedia)
    return new TweetMediaFile({
      tweetId: tweetId,
      createdAt: createdAt,
      tweetUser: tweet.user,
      type: mediaToTweetMediaType(tweetMedia),
      source: tweetMedia.getVariantUrl('orig'),
      serial: mediaToSerial(tweetMedia),
      ext: pathInfo.ext,
      hash: pathInfo.name,
    })
  }
}

const mediaToTweetMediaType: Factory<
  TweetMedia,
  PropsOf<TweetMediaFile>['type']
> = media =>
  media.mapBy(props => {
    switch (props.type) {
      case 'photo':
        return 'image'

      case 'thumbnail':
        return 'thumbnail'

      case 'video':
        return 'video'
    }
  })

const mediaToSerial: Factory<TweetMedia, number> = media =>
  media.mapBy(props => props.index + 1)

const mediaToParsedPath: Factory<TweetMedia, path.ParsedPath> = media => {
  const url = media.mapBy(props => new URL(props.url))

  for (const key of url.searchParams.keys()) {
    url.searchParams.delete(key)
  }

  return path.parse(url.pathname)
}
