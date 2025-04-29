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

export const isMediaTweet = (tweet: XApi.Tweet): tweet is XApi.MediaTweet =>
  tweet?.legacy?.extended_entities !== undefined

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
}
