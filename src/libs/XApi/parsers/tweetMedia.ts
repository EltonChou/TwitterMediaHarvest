/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TweetMedia } from '#domain/valueObjects/tweetMedia'

type MediaCollection = { images: TweetMedia[]; videos: TweetMedia[] }

export const makeEmptyMediaCollection = (): MediaCollection => ({
  images: [],
  videos: [],
})

export const parseMedias = (medias: XApi.Media[]): MediaCollection => {
  let imageIndex = 0
  let videoIndex = 0

  const increaseImageIdx = () => (imageIndex += 1)
  const increaseVideoIndex = () => (videoIndex += 1)

  return medias.reduce<MediaCollection>((mediaCollection, media) => {
    mediaCollection.images.push(
      new TweetMedia({
        index: imageIndex,
        type: media.type === 'photo' ? 'photo' : 'thumbnail',
        url: media.media_url_https,
      })
    )
    increaseImageIdx()

    if (isVideoMedia(media)) {
      const url = parseBestVideoVariant(media)
      if (url) {
        mediaCollection.videos.push(
          new TweetMedia({
            index: videoIndex,
            type: 'video',
            url: url,
          })
        )
        increaseVideoIndex()
      }
    }

    return mediaCollection
  }, makeEmptyMediaCollection())
}

const parseBestVideoVariant = (media: XApi.VideoMedia): string | undefined =>
  media.video_info.variants
    .filter(isMp4)
    .reduce((prevVariant, currVariant) =>
      currVariant?.bitrate >= prevVariant?.bitrate ? currVariant : prevVariant
    ).url

const isVideoMedia = (media: XApi.Media): media is XApi.VideoMedia =>
  media.type === 'animated_gif' || media.type === 'video'

const isMp4 = (variant: XApi.VideoVariant): variant is XApi.Mp4Variant =>
  variant.content_type === 'video/mp4'
