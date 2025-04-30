import { generateTweet } from '#utils/test/tweet'
import { TweetWithContent } from './tweetWithContent'

describe('TweetWithContent', () => {
  const mockTweet = generateTweet()
  const mockContent = 'test content'

  it('should create TweetWithContent instance', () => {
    const tweetWithContent = new TweetWithContent({
      tweet: mockTweet,
      content: mockContent,
    })
    expect(tweetWithContent).toBeInstanceOf(TweetWithContent)
  })

  it('should return tweet id through id getter', () => {
    const tweetWithContent = new TweetWithContent({
      tweet: mockTweet,
      content: mockContent,
    })
    expect(tweetWithContent.id).toBe(mockTweet.id)
  })

  it('should return tweet through tweet getter', () => {
    const tweetWithContent = new TweetWithContent({
      tweet: mockTweet,
      content: mockContent,
    })
    expect(tweetWithContent.tweet).toBe(mockTweet)
  })

  it('should return content through content getter', () => {
    const tweetWithContent = new TweetWithContent({
      tweet: mockTweet,
      content: mockContent,
    })
    expect(tweetWithContent.content).toBe(mockContent)
  })
})
