/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const isTimelineTimelineModule = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineModule =>
  entryContent.__typename === 'TimelineTimelineModule'

export const isTimelineTimelineItem = (
  entryContent: XApi.EntryContent
): entryContent is XApi.TimelineTimelineItem =>
  entryContent.__typename === 'TimelineTimelineItem'

export const isTimelineTweet = (
  timelineItemContent: XApi.TimelineItemContent
): timelineItemContent is XApi.TimelineTweet =>
  timelineItemContent.__typename === 'TimelineTweet'

export const isMediaTweet = (tweet: XApi.Tweet): tweet is XApi.MediaTweet => {
  const entities = tweet?.legacy?.entities ?? tweet.legacy.extended_entities
  if (!entities) return false
  return Object.hasOwn(entities, 'media')
}

export const isRetweet = (tweet: XApi.Tweet): tweet is XApi.RetweetTweet =>
  'retweeted_status_result' in tweet.legacy

export class Instruction {
  static isTimelineAddEntries(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelineAddEntries {
    return instruction.type === 'TimelineAddEntries'
  }

  static isTimelinePinEntry(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelinePinEntry {
    return instruction.type === 'TimelinePinEntry'
  }

  static isTimelineAddToModule(
    instruction: XApi.Instruction
  ): instruction is XApi.TimelineAddToModule {
    return instruction.type === 'TimelineAddToModule'
  }
}
