import { TweetUser } from '#domain/valueObjects/tweetUser'
import { faker } from '@faker-js/faker'

export const generateTweetUser = () =>
  new TweetUser({
    displayName: faker.internet.displayName(),
    isProtected: faker.datatype.boolean(),
    screenName: faker.internet.userName(),
    userId: faker.string.numeric(),
  })
