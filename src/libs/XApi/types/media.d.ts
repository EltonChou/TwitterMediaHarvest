/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Media items. Both response formats use this shape
 * (`extended_entities.media` in v1, `media_entities2` in v2).
 */
declare namespace XApi {
  interface Mp4Variant {
    bitrate: number
    content_type: 'video/mp4'
    url: string
  }

  interface MpegUrlVariant {
    bitrate: 0
    content_type: 'application/x-mpegURL'
    url: string
  }

  type VideoVariant = Mp4Variant | MpegUrlVariant

  interface BaseMedia {
    type: string
    media_url_https: string
    // Optional field indicating external media availability
    ext_media_availability?: {
      reason?: string
      status?: string
    }
  }

  interface ImageMedia extends BaseMedia {
    type: 'photo'
  }

  interface VideoMedia extends BaseMedia {
    type: 'video' | 'animated_gif'
    video_info: {
      variants: VideoVariant[]
    }
  }

  type Media = XApi.ImageMedia | XApi.VideoMedia
}
