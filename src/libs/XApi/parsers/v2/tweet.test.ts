import { isErrorResult } from '#utils/result'
import { isMediaTweet } from './refinements'
import {
  parseTweet,
  retrieveTweetFromTweetResult,
  retrieveTweetsFromInstruction,
} from './tweet'
import fs from 'node:fs'
import path from 'node:path'

const readTestData = (responseName: string) =>
  JSON.parse(
    fs
      .readFileSync(
        path.resolve(__dirname, 'test-data', `${responseName}.json`)
      )
      .toString()
  )

const instructionsOf = {
  UserOriginalsTimeline: (body: XApi.V2.UserOriginalsTimelineBody) =>
    body.data.user_result_by_screen_name.result.profile_user_originals_timeline
      .timeline.instructions,
  SearchByRawQuery: (body: XApi.V2.SearchByRawQueryBody) =>
    body.data.search_by_raw_query.search_timeline.timeline.instructions,
}

const retrieveTweets = (responseName: keyof typeof instructionsOf) =>
  instructionsOf[responseName](readTestData(responseName)).flatMap(
    retrieveTweetsFromInstruction
  )

describe('unit test for new-format tweet parser', () => {
  it.each([
    { responseName: 'UserOriginalsTimeline', tweetCount: 20, mediaCount: 6 },
    { responseName: 'SearchByRawQuery', tweetCount: 21, mediaCount: 19 },
  ] as const)(
    'should retrieve tweets from $responseName',
    ({ responseName, tweetCount, mediaCount }) => {
      const tweets = retrieveTweets(responseName)

      expect(tweets).toHaveLength(tweetCount)
      expect(tweets.filter(isMediaTweet)).toHaveLength(mediaCount)
    }
  )

  it('should parse a media tweet from a timeline module', () => {
    const tweet = retrieveTweets('SearchByRawQuery').find(
      tweet => tweet.rest_id === '2118356235661766739'
    )
    expect(tweet).toBeDefined()

    const { tweet: parsed, content } = parseTweet(tweet!)

    expect(parsed.id).toBe('2118356235661766739')
    expect(parsed.mapBy(props => props.createdAt)).toEqual(
      new Date(1793890458000)
    )
    expect(parsed.mapBy(props => props.hashtags)).toEqual([
      'LoveMeToHurtMe',
      'รักเท่ากับร้าย',
      'TanYuyu',
      'แทนหยู่ยู้',
    ])
    expect(parsed.user.mapBy(props => props)).toEqual({
      userId: '2438094432',
      displayName: expect.any(String),
      screenName: 'weiandare',
      isProtected: false,
    })
    expect(parsed.images).toHaveLength(5)
    expect(parsed.videos).toHaveLength(1)
    expect(content.startsWith('#LoveMeToHurtMe')).toBe(true)
  })

  it.each([
    {
      name: 'tombstone',
      result: { __typename: 'TweetTombstone' },
    },
    {
      name: 'tweet with unavailable author',
      result: {
        __typename: 'Tweet',
        rest_id: '1',
        core: { user_results: { result: { __typename: 'UserUnavailable' } } },
        details: { created_at_ms: 0, full_text: '' },
      },
    },
  ])('should reject $name', ({ result }) => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(
      isErrorResult(
        retrieveTweetFromTweetResult({ result } as XApi.V2.TweetResult)
      )
    ).toBe(true)
  })
})
