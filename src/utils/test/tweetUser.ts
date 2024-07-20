import { TweetUser } from '#domain/valueObjects/tweetUser'
import { faker } from '@faker-js/faker'

export const generateTweetUser = () =>
  new TweetUser({
    displayName: faker.internet.displayName(),
    screenName: faker.internet.userName(),
    userId: faker.string.numeric(),
  })
