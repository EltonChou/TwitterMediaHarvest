import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import { generateTweetUser } from './tweetUser'
import { faker } from '@faker-js/faker/locale/en'

export const generateTweetMediaFile = ({
  isVideo,
}: { isVideo?: boolean } = {}) =>
  new TweetMediaFile({
    type: isVideo
      ? 'video'
      : faker.helpers.arrayElement(['image', 'thumbnail']),
    createdAt: faker.date.anytime(),
    ext: isVideo
      ? '.mp4'
      : '.' + faker.helpers.arrayElement(['jpeg', 'jpg', 'png']),
    hash: faker.string.nanoid(),
    source: faker.internet.url(),
    tweetId: faker.string.numeric(),
    serial: faker.number.int({ min: 1, max: 4 }),
    tweetUser: generateTweetUser(),
  })
