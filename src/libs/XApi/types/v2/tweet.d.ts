/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * New GraphQL response format (e.g. UserOriginalsTimeline, SearchByRawQuery).
 * Kept apart from the legacy format on purpose: do not adapt one into the other.
 */
declare namespace XApi.V2 {
  interface Timeline {
    timeline: {
      instructions: Instruction[]
    }
  }

  interface UserOriginalsTimelineBody {
    data: {
      user_result_by_screen_name: {
        result: {
          __typename: 'User'
          profile_user_originals_timeline: Timeline
        }
      }
    }
  }

  interface SearchByRawQueryBody {
    data: {
      search_by_raw_query: {
        search_timeline: Timeline
      }
    }
  }

  interface Instruction {
    __typename: string
  }

  interface TimelineAddEntries extends Instruction {
    __typename: 'TimelineAddEntries'
    entries: TimelineEntry[]
  }

  interface TimelinePinEntry extends Instruction {
    __typename: 'TimelinePinEntry'
    entry: TimelineEntry
  }

  interface TimelineEntry {
    entry_id: string
    sort_index: string
    content: EntryContent
  }

  interface EntryContent {
    __typename: string
  }

  interface TimelineTimelineItem extends EntryContent {
    __typename: 'TimelineTimelineItem'
    content: ItemContent
  }

  interface TimelineTimelineModule extends EntryContent {
    __typename: 'TimelineTimelineModule'
    items: {
      entry_id: string
      item: { content: ItemContent }
    }[]
  }

  interface ItemContent {
    __typename: string
  }

  interface TimelineTweet extends ItemContent {
    __typename: 'TimelineTweet'
    tweet_results: TweetResult
  }

  interface TweetResult {
    rest_id?: string
    result?: { __typename: string }
  }

  interface User {
    __typename: 'User'
    rest_id: string
    core: {
      name: string
      screen_name: string
    }
    privacy: {
      protected: boolean
    }
  }

  interface Tweet {
    __typename: 'Tweet'
    rest_id: string
    core: {
      user_results: { result: User }
    }
    details: {
      created_at_ms: number
      full_text: string
      hashtag_entities?: { indices: [number, number]; text: string }[]
    }
    media_entities2?: XApi.Media[]
  }
}
