/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
declare namespace XApi {
  interface TypeItem {
    __typename: string
  }

  interface TweetByRestIdBody {
    data: {
      tweetResult: PosibleTweetResult
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

  interface BaseUser {
    id: string
    rest_id: string
  }

  interface User extends BaseUser {
    core: {
      created_at: Date
      name: string
      screen_name: string
    }
    privacy: {
      protected: boolean
    }
  }

  interface LegacyUser extends BaseUser {
    legacy: {
      name: string
      screen_name: string
      protected?: boolean
    }
  }

  interface DataResult<T> {
    result: T
  }

  type PosibleTweetResult = DataResult<
    Tweet | TweetWithVisibilityResults | TweetTombstone | TypeItem
  >

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
    retweeted_status_result: PosibleTweetResult
  }

  interface Hashtag {
    indices: [number, number]
    text: string
  }

  interface TweetEntities {
    hashtags: Hashtag[]
  }

  interface Tweet extends TypeItem {
    __typename: 'Tweet'
    rest_id: string
    core: {
      user_results: DataResult<User | LegacyUser>
    }
    legacy: TweetLegacy | MediaTweetLegacy | RetweetTweetLegacy
    [k: string]: unknown
  }

  interface MediaTweet extends TweetLike {
    legacy: MediaTweetLegacy
  }

  interface RetweetTweet extends TweetLike {
    legacy: RetweetTweetLegacy
  }

  interface TweetLike extends Tweet {
    __typename: never
  }

  interface TweetWithVisibilityResults {
    limitedActionResults: {
      limited_actions: []
    }
    tweet: TweetLike
  }

  interface TweetTombstone extends TypeItem {
    __typename: 'TweetTombstone'
  }

  interface TimelineTweet extends TimelineItemContent {
    itemType: 'TimelineTweet'
    __typename: 'TimelineTweet'
    tweet_results: PosibleTweetResult
  }

  interface TimelineItemContent extends TypeItem {
    itemType: string
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
