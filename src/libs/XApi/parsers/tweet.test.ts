import { TweetWithContent } from '#domain/valueObjects/tweetWithContent'
import { isMediaTweetLegacy } from './refinements'
import {
  retrieveTweetsFromDeviceFollow,
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

describe('unit test for tweet parser', () => {
  it.each([
    {
      responseName: 'UserMedia',
      tweetCount: 14,
    },
    { responseName: 'UserTweets', tweetCount: 20 },
    { responseName: 'TweetDetail', tweetCount: 8 },
  ])('should parse from $reponseName', ({ responseName, tweetCount }) => {
    const body = readTestData(responseName)

    const tweets = (body.instructions as XApi.Instruction[])
      .map(retrieveTweetsFromInstruction)
      .flat()

    expect(tweets.length).toBe(tweetCount)
  })
})

describe('unit test for device-follow (globalObjects) parser', () => {
  const body = readTestData(
    'NotificationDeviceFollow'
  ) as XApi.NotificationDeviceFollowBody

  it('should parse media tweets into TweetWithContent', () => {
    const tweets = retrieveTweetsFromDeviceFollow(body)

    expect(tweets).toHaveLength(21)
    expect(tweets.every(tweet => tweet instanceof TweetWithContent)).toBe(true)
  })

  it('should resolve author from the users map and keep full_text', () => {
    const tweets = retrieveTweetsFromDeviceFollow(body)

    expect(tweets.every(tweet => tweet.content.length > 0)).toBe(true)
    expect(
      tweets.every(
        tweet => tweet.tweet.user.mapBy(p => p.screenName).length > 0
      )
    ).toBe(true)
  })

  it('should parse video media from a media tweet', () => {
    const tweets = retrieveTweetsFromDeviceFollow(body)

    expect(tweets.some(tweet => tweet.tweet.videos.length > 0)).toBe(true)
  })

  it.each([
    { hasMedia: true, expected: true },
    { hasMedia: false, expected: false },
  ])(
    'isMediaTweetLegacy returns $expected when extended_entities media is $hasMedia',
    ({ hasMedia, expected }) => {
      const legacy = {
        ...(hasMedia
          ? { extended_entities: { media: [{ type: 'photo' }] } }
          : {}),
      } as XApi.TweetLegacy

      expect(isMediaTweetLegacy(legacy)).toBe(expected)
    }
  )
})
