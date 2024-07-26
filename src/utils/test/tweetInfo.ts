import { TweetInfo } from '#domain/valueObjects/tweetInfo'
import { faker } from '@faker-js/faker'

export const generateTweetInfo = () =>
  new TweetInfo({
    screenName: faker.internet.displayName(),
    tweetId: faker.string.numeric(),
  })
