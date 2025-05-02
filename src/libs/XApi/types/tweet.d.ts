/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
declare namespace XApi {
  interface TweetByRestIdBody {
    data: {
      tweetResult: DataResult<Tweet>
    }
  }

  interface TweetDetailBody {
    data: {
      threaded_conversation_with_injections_v2: {
        instructions: Instruction[]
      }
    }
  }

  interface UserTimelineBody {
    data: {
      user: {
        result: {
          __typename: 'User'
          timeline: {
            timeline: {
              instructions: Instruction[]
            }
          }
        }
      }
    }
  }

  interface HomeTimelineBody {
    data: {
      home: {
        home_timeline_urt: {
          instructions: Instruction[]
        }
      }
    }
  }

  interface BookmarkTimelineBody {
    data: {
      bookmark_timeline_v2: {
        timeline: {
          instructions: Instruction[]
        }
      }
    }
  }

  interface CommunitiesExploreTimelineBody {
    data: {
      viewer: {
        explore_communities_timeline: {
          timeline: { instructions: Instruction[] }
        }
      }
    }
  }

  interface ListTimelineBody {
    data: {
      list: {
        tweets_timeline: {
          timeline: {
            instructions: Instruction[]
          }
        }
      }
    }
  }

  interface Instruction {
    type: string
  }

  interface ModuleItem {
    entryId: string
    item: {
      itemContent: TimelineTweet
    }
  }

  interface TimelineAddToModule extends Instruction {
    type: 'TimelineAddToModule'
    moduleEntryId: string
    moduleItems: ModuleItem[]
  }

  interface TimelinePinEntry extends Instruction {
    type: 'TimelinePinEntry'
    entry: {
      content: TimelineTimelineItem
    }
  }

  interface TimelineAddEntries extends Instruction {
    type: 'TimelineAddEntries'
    entries: TimelineAddEntry[]
  }

  interface TimelineAddEntry {
    entryId: string
    sortIndex: string
    content: EntryContent | TimelineTimelineItem | TimelineTimelineModule
  }

  interface EntryContent {
    entryType: string
    __typename: string
  }

  interface User {
    id: string
    rest_id: string
    legacy: {
      name: string
      screen_name: string
      protected?: boolean
    }
  }

  interface DataResult<T> {
    result: T
  }

  interface TweetLegacy {
    user_id_str: string
    id_str: string
    full_text: string
    entities: TweetEntities
    created_at: string
    [k: string]: unknown
  }

  interface MediaTweetLegacy extends TweetLegacy {
    extended_entities: {
      media: Media[]
    }
  }

  interface RetweetTweetLegacy extends TweetLegacy {
    retweeted_status_result: DataResult<Tweet>
  }

  interface Hashtag {
    indices: [number, number]
    text: string
  }

  interface TweetEntities {
    hashtags: Hashtag[]
  }

  interface Tweet {
    __typename: 'Tweet'
    rest_id: string
    core: {
      user_results: DataResult<User>
    }
    legacy: TweetLegacy | MediaTweetLegacy | RetweetTweetLegacy
    [k: string]: unknown
  }

  interface MediaTweet extends Tweet {
    legacy: MediaTweetLegacy
  }

  interface RetweetTweet extends Tweet {
    legacy: RetweetTweetLegacy
  }

  interface TimelineTweet extends TimelineItemContent {
    itemType: 'TimelineTweet'
    __typename: 'TimelineTweet'
    tweet_results: DataResult<Tweet>
  }

  interface TimelineItemContent {
    itemType: string
    __typename: string
  }

  interface TimelineTimelineItem extends EntryContent {
    entryType: 'TimelineTimelineItem'
    __typename: 'TimelineTimelineItem'
    itemContent: TimelineTweet | TimelineItemContent
  }

  interface TimelineTimelineModule extends EntryContent {
    entryType: 'TimelineTimelineModule'
    __typename: 'TimelineTimelineModule'
    items: ConversationThreadItem[]
  }

  interface ConversationThreadItem {
    entryId: string
    item: {
      itemContent: TimelineTweet | TimelineItemContent
    }
  }

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
