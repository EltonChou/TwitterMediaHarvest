import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { faker } from '@faker-js/faker'

export const generateImageTweetMedia = (index: number) =>
  new TweetMedia({
    index: index,
    type: faker.helpers.arrayElement(['image', 'thumbnail']),
    url: faker.internet.url(),
  })

export const generateVideoTweetMedia = (index: number) =>
  new TweetMedia({
    index: index,
    type: 'video',
    url: faker.internet.url(),
  })
