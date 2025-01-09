import {
  DownloadHistory,
  DownloadHistoryId,
} from '#domain/entities/downloadHistory'
import MediaType from '#enums/mediaType'
import { generateTweetUser } from './tweetUser'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadHistory = () =>
  new DownloadHistory(new DownloadHistoryId(faker.string.numeric(10)), {
    downloadTime: faker.date.past(),
    hashtags: faker.helpers.multiple(() => faker.word.noun()),
    mediaType: faker.helpers.arrayElement([
      MediaType.Image,
      MediaType.Mixed,
      MediaType.Video,
    ]),
    thumbnail: faker.internet.url(),
    tweetTime: faker.date.past(),
    tweetUser: generateTweetUser(),
  })
