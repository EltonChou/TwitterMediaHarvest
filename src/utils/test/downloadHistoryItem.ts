import MediaType from '#enums/mediaType'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadHistoryItem = (): DownloadHistoryItem => ({
  displayName: faker.internet.displayName(),
  screenName: faker.internet.username(),
  downloadTime: faker.date.recent(),
  hashtags: new Set(['a', 'b', 'c']),
  mediaType: faker.helpers.arrayElement([
    MediaType.Mixed,
    MediaType.Image,
    MediaType.Video,
  ]),
  thumbnail: faker.image.url(),
  tweetId: '1',
  tweetTime: faker.date.recent(),
  userId: faker.string.numeric(),
})
