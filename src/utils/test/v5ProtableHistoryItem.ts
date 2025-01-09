import { V5PortableDownloadHistoryItem } from '#domain/valueObjects/portableDownloadHistoryItem'
import MediaType from '#enums/mediaType'
import { faker } from '@faker-js/faker/locale/en'

export const generatePortableDownloadHistoryItem = () =>
  new V5PortableDownloadHistoryItem({
    displayName: faker.internet.displayName(),
    screenName: faker.internet.username(),
    downloadTime: faker.date.recent(),
    hashtags: faker.helpers.arrayElements(['a', 'b', 'c']),
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
