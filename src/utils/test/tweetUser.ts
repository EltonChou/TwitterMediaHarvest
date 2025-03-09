import { TweetUser } from '#domain/valueObjects/tweetUser'
import { faker } from '@faker-js/faker/locale/en'

export const generateTweetUser = () =>
  new TweetUser({
    displayName: faker.internet.displayName(),
    screenName: faker.internet.username(),
    userId: faker.string.numeric(),
    isProtected: faker.datatype.boolean(),
  })
