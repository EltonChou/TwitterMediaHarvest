/**
 * @jest-environment jsdom
 */
import { MockCommandCache } from '../mock/commandCache'
import { FetchTweetError, ParseTweetError } from './abstractFetchTweet'
import { RestIdFetchTweetCommand } from './restIdFetchTweet'
import fs from 'node:fs'
import path from 'node:path'

describe('unit test for latest fetch tweet command', () => {
  const mockResponseBody = JSON.parse(
    fs.readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        'test-data',
        'TweetResultByRestId.json'
      ),
      { encoding: 'utf-8' }
    )
  )

  const mockCache = new MockCommandCache()

  it.each([
    { cacheProvider: async () => mockCache },
    { cacheProvider: mockCache },
  ])('can cache', async ({ cacheProvider }) => {
    const command = new RestIdFetchTweetCommand({
      tweetId: '1901057939403608167',
      csrfToken: 'token',
      cacheProvider: cacheProvider,
    })

    const request = await command.prepareRequest({
      hostname: 'x.com',
      protocol: 'https',
    })

    const response = new Response(mockResponseBody, {
      headers: new Headers({ 'x-rate-limit-remaining': '100' }),
      status: 200,
    })

    await command.putIntoCache(request, response)

    const cachedResponse = await command.readFromCache(request)
    expect(cachedResponse).toBeDefined()
  })

  it('can prepare request', async () => {
    const command = new RestIdFetchTweetCommand({
      tweetId: '1901057939403608167',
      csrfToken: 'token',
      cacheProvider: mockCache,
    })

    const request = await command.prepareRequest({
      hostname: 'x.com',
      protocol: 'https',
    })

    expect(request instanceof Request).toBeTrue()
  })

  it.each([
    { tweetId: '1587894226695884800', responseType: 'image' },
    // { tweetId: '1900881067713982967', responseType: 'video' },
    // { tweetId: '1829835601941823508', responseType: 'tagged-video' },
  ])(
    'should return a successful result when the $responseType response is ok',
    async ({ responseType, tweetId }) => {
      const command = new RestIdFetchTweetCommand({
        tweetId: tweetId,
        csrfToken: 'token',
        cacheProvider: mockCache,
      })

      const resetTimeInSecond = 18888888

      const result = await command.resolveResponse(
        new Response(JSON.stringify(mockResponseBody[responseType]), {
          headers: new Headers({
            'x-rate-limit-remaining': '100',
            'x-rate-limit-reset': resetTimeInSecond.toString(),
          }),
          status: 200,
        })
      )

      expect(result).toMatchSnapshot()
      expect(result.$metadata.httpStatusCode).toBe(200)
      expect(result.$metadata.remainingQuota).toBe(100)
      expect(result.$metadata.quotaResetTime).toEqual(
        new Date(resetTimeInSecond * 1000)
      )
      expect(result.tweetResult.error).toBeUndefined()
      expect(result.tweetResult.value).toBeDefined()
    }
  )

  it('should handle a parse error when body is not json', async () => {
    const command = new RestIdFetchTweetCommand({
      tweetId: '1587894226695884800',
      csrfToken: 'token',
      cacheProvider: mockCache,
    })

    const invalidBodyResponse = 'Invalid body'
    const resetTimeInSecond = 18888888

    const result = await command.resolveResponse(
      new Response(invalidBodyResponse, {
        headers: new Headers({
          'x-rate-limit-remaining': '100',
          'x-rate-limit-reset': resetTimeInSecond.toString(),
        }),
        status: 200,
      })
    )

    expect(result).toMatchSnapshot()
    expect(result.$metadata.httpStatusCode).toBe(200)
    expect(result.$metadata.remainingQuota).toBe(100)
    expect(result.$metadata.quotaResetTime).toEqual(
      new Date(resetTimeInSecond * 1000)
    )
    expect(result.tweetResult.error instanceof ParseTweetError).toBeTrue()
    expect(result.tweetResult.value).toBeUndefined()
  })

  it('should handle a parse error', async () => {
    const command = new RestIdFetchTweetCommand({
      tweetId: '1587894226695884800',
      csrfToken: 'token',
      cacheProvider: mockCache,
    })

    const invalidJsonResponse = JSON.stringify({ error: 'invalid json' })
    const resetTimeInSecond = 18888888

    const result = await command.resolveResponse(
      new Response(invalidJsonResponse, {
        headers: new Headers({
          'x-rate-limit-remaining': '100',
          'x-rate-limit-reset': resetTimeInSecond.toString(),
        }),
        status: 200,
      })
    )

    expect(result).toMatchSnapshot()
    expect(result.$metadata.httpStatusCode).toBe(200)
    expect(result.$metadata.remainingQuota).toBe(100)
    expect(result.$metadata.quotaResetTime).toEqual(
      new Date(resetTimeInSecond * 1000)
    )
    expect(result.tweetResult.error instanceof ParseTweetError).toBeTrue()
    expect(result.tweetResult.value).toBeUndefined()
  })

  it('should handle FetchTweetError', async () => {
    const command = new RestIdFetchTweetCommand({
      tweetId: '1587894226695884800',
      csrfToken: 'token',
      cacheProvider: mockCache,
    })

    const errorResponse = JSON.stringify({ error: 'Tweet not found' })
    const resetTimeInSecond = 18888888

    const result = await command.resolveResponse(
      new Response(errorResponse, {
        headers: new Headers({
          'x-rate-limit-remaining': '100',
          'x-rate-limit-reset': resetTimeInSecond.toString(),
        }),
        status: 404,
      })
    )

    expect(result).toMatchSnapshot()
    expect(result.$metadata.httpStatusCode).toBe(404)
    expect(result.$metadata.remainingQuota).toBe(100)
    expect(result.$metadata.quotaResetTime).toEqual(
      new Date(resetTimeInSecond * 1000)
    )
    expect(result.tweetResult.error instanceof FetchTweetError).toBeTrue()
    expect(result.tweetResult.value).toBeUndefined()
  })
})
