/**
 * @jest-environment jsdom
 */
import {
  isBetaTweetDeck,
  isBusinessRelatedTweet,
  isComposingTweet,
  isDefined,
  isFunctionablePath,
  isInTweetStatus,
  isStreamLoaded,
  isTweetDeck,
  isTwitter,
} from './checker'
import { elementExists } from 'select-dom'

const mockExists = elementExists as jest.MockedFunction<typeof elementExists>

jest.mock('select-dom')

const setHost = (host: string) =>
  Object.defineProperty(window, 'location', {
    value: { host },
    writable: true,
  })

const setPath = (path: string) =>
  Object.defineProperty(window, 'location', {
    value: { pathname: path },
    writable: true,
  })

describe('isStreamLoaded', () => {
  it('should return true if both role="region" and article exist', () => {
    mockExists.mockReturnValueOnce(true).mockReturnValueOnce(true)
    expect(isStreamLoaded()).toBe(true)
  })

  it('should return false if either role="region" or article does not exist', () => {
    mockExists.mockReturnValueOnce(false)
    expect(isStreamLoaded()).toBe(false)
  })
})

describe('isTweetDeck', () => {
  it('should return true if the host is tweetdeck.twitter.com', () => {
    setHost('tweetdeck.twitter.com')
    expect(isTweetDeck()).toBe(true)
  })

  it('should return false if the host is not tweetdeck.twitter.com', () => {
    setHost('example.com')
    expect(isTweetDeck()).toBe(false)
  })
})

describe('isTwitter', () => {
  it('should return true if the host is x.com or mobile.x.com', () => {
    setHost('x.com')
    expect(isTwitter()).toBe(true)

    setHost('mobile.x.com')
    expect(isTwitter()).toBe(true)
  })

  it('should return false if the host is not x.com or mobile.x.com', () => {
    setHost('example.com')
    expect(isTwitter()).toBe(false)
  })
})

describe('isComposingTweet', () => {
  it('should return true if the pathname matches compose or intent tweet', () => {
    setPath('/compose/tweet')
    expect(isComposingTweet()).toBe(true)

    setPath('/intent/tweet')
    expect(isComposingTweet()).toBe(true)
  })

  it('should return false if the pathname does not match compose or intent tweet', () => {
    setPath('/home')
    expect(isComposingTweet()).toBe(false)
  })
})

describe('isFunctionablePath', () => {
  it('should return false if the pathname matches tweet list, retweets, likes, or composing tweet', () => {
    setPath('/i/lists/add_member')
    expect(isFunctionablePath()).toBe(false)

    setPath('/12345/retweets')
    expect(isFunctionablePath()).toBe(false)

    setPath('/12345/likes')
    expect(isFunctionablePath()).toBe(false)

    setPath('/compose/tweet')
    expect(isFunctionablePath()).toBe(false)
  })

  it('should return true if the pathname does not match any of the excluded paths', () => {
    setPath('/home')
    expect(isFunctionablePath()).toBe(true)
  })
})

describe('isInTweetStatus', () => {
  it('should return true if the pathname matches tweet status regex', () => {
    setPath('/user/status/12345')
    expect(isInTweetStatus()).toBe(true)
  })

  it('should return false if the pathname does not match tweet status regex', () => {
    setPath('/home')
    expect(isInTweetStatus()).toBe(false)
  })
})

describe('isBetaTweetDeck', () => {
  it('should return true if in TweetDeck and #react-root exists', () => {
    setHost('tweetdeck.twitter.com')
    mockExists.mockReturnValueOnce(true)
    expect(isBetaTweetDeck()).toBe(true)
  })

  it('should return false if not in TweetDeck or #react-root does not exist', () => {
    setHost('tweetdeck.twitter.com')
    mockExists.mockReturnValueOnce(false)
    expect(isBetaTweetDeck()).toBe(false)

    setHost('example.com')
    expect(isBetaTweetDeck()).toBe(false)
  })
})

describe('isBusinessRelatedTweet', () => {
  it('should return true if the element has a data-testid of placementTracking or is within an element that has it', () => {
    const element = document.createElement('div')
    mockExists.mockReturnValueOnce(true)
    expect(isBusinessRelatedTweet(element)).toBe(true)
  })

  it('should return false if the element does not have a data-testid of placementTracking or is not within an element that has it', () => {
    const element = document.createElement('div')
    mockExists.mockReturnValueOnce(false)
    expect(isBusinessRelatedTweet(element)).toBe(false)
  })
})

describe('isDefined', () => {
  it('should return true if all parameters are defined', () => {
    expect(isDefined(1, 'a', {}, [])).toBe(true)
  })

  it('should return false if any parameter is undefined', () => {
    expect(isDefined(1, undefined, 'a')).toBe(false)
  })
})
