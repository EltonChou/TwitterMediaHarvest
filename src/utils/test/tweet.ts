import { Tweet } from '#domain/valueObjects/tweet'
import { generateImageTweetMedia } from './tweetMedia'
import { generateTweetUser } from './tweetUser'
import { faker } from '@faker-js/faker/locale/en'

export const generateTweet = () =>
  new Tweet({
    user: generateTweetUser(),
    images: faker.helpers.multiple(() => generateImageTweetMedia(0), {
      count: { max: 4, min: 0 },
    }),
    hashtags: faker.helpers.multiple(() => faker.word.noun()),
    createdAt: new Date(),
    id: faker.string.numeric(),
    videos: [],
  })
