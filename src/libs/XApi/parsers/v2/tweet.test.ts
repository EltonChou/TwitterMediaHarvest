import { isErrorResult, isSuccessResult } from '#utils/result'
import { isMediaTweet } from './refinements'
import {
  parseTweet,
  retrieveTweetFromTweetResult,
  retrieveTweetsFromInstruction,
  withRetweetedTweet,
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

// The use case owns the exact body paths; the parser only needs the array.
const findInstructions = (node: unknown): XApi.V2.Instruction[] => {
  if (!node || typeof node !== 'object') return []
  if ('instructions' in node && Array.isArray(node.instructions))
    return node.instructions
  return Object.values(node).flatMap(findInstructions)
}

const retrieveTweets = (responseName: string) =>
  findInstructions(readTestData(responseName)).flatMap(
    retrieveTweetsFromInstruction
  )

const photo: XApi.Media = {
  type: 'photo',
  media_url_https: 'https://pbs.twimg.com/media/photo.jpg',
}

const makeTweet = (
  restId: string,
  overrides: Partial<XApi.V2.Tweet> = {}
): XApi.V2.Tweet => ({
  __typename: 'Tweet',
  rest_id: restId,
  core: {
    user_results: {
      result: {
        __typename: 'User',
        rest_id: '1',
        core: { name: 'name', screen_name: 'screen_name' },
        privacy: { protected: false },
      },
    },
  },
  details: { created_at_ms: 0, full_text: '' },
  media_entities2: [],
  ...overrides,
})

const makeRetweet = (original: XApi.V2.TweetResult['result']) =>
  makeTweet('retweet', {
    legacy: { retweeted_status_results: { result: original } },
  })

const withVisibility = (tweet: XApi.V2.Tweet) => ({
  __typename: 'TweetWithVisibilityResults',
  tweet,
})

describe('unit test for new-format tweet parser', () => {
  it.each([
    ['UserOriginalsTimeline', 20, 20, 6],
    ['SearchByRawQuery', 21, 21, 19],
    ['UserRepliesTimeline', 40, 40, 5],
    ['UserRepostsTimeline', 20, 40, 33],
    ['UserVideoTimeline', 19, 19, 19],
    ['likesQuery', 20, 20, 20],
    ['BookmarkTimeline', 15, 15, 15],
    ['tweetNotificationsQuery', 19, 28, 17],
    ['ListTimeline', 9, 13, 7],
    ['HomeTimeline', 35, 39, 34],
  ])(
    'should retrieve tweets from %s',
    (responseName, tweetCount, withRetweetedCount, mediaCount) => {
      const tweets = retrieveTweets(responseName)
      const withRetweeted = tweets.flatMap(withRetweetedTweet)

      expect(tweets).toHaveLength(tweetCount)
      expect(withRetweeted).toHaveLength(withRetweetedCount)
      expect(withRetweeted.filter(isMediaTweet)).toHaveLength(mediaCount)
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

  it('should unwrap a tweet with visibility results', () => {
    const tweet = makeTweet('1')
    const result = retrieveTweetFromTweetResult({
      result: withVisibility(tweet),
    })

    expect(isSuccessResult(result) && result.value).toBe(tweet)
  })

  it('should keep the retweeted tweet even if the retweet has no media', () => {
    const original = makeTweet('original', { media_entities2: [photo] })
    const retweet = makeRetweet(original)

    const tweets = withRetweetedTweet(retweet)

    expect(tweets).toEqual([retweet, original])
    expect(tweets.filter(isMediaTweet)).toEqual([original])
  })

  it('should unwrap a retweeted tweet with visibility results', () => {
    const original = makeTweet('original')

    expect(withRetweetedTweet(makeRetweet(withVisibility(original)))).toEqual([
      expect.objectContaining({ rest_id: 'retweet' }),
      original,
    ])
  })

  it('should return only the tweet itself if it is not a retweet', () => {
    const tweet = makeTweet('1')

    expect(withRetweetedTweet(tweet)).toEqual([tweet])
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
    {
      // UserPhotoTimeline grid item: no created_at_ms, hashtags or privacy.
      name: 'incomplete MediaGrid tweet',
      result: {
        __typename: 'Tweet',
        rest_id: '1',
        core: {
          user_results: {
            result: {
              __typename: 'User',
              rest_id: '1',
              core: { name: 'name', screen_name: 'screen_name' },
            },
          },
        },
        details: { full_text: 'text https://t.co/x' },
        legacy: {},
        media_entities2: [photo],
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
