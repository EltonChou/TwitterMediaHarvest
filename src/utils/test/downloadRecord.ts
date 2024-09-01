import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { generateDownloadConfig } from './downloadConfig'
import { generateTweetInfo } from './tweetInfo'
import { faker } from '@faker-js/faker/locale/en'

export const generateDownloadRecord = () =>
  new DownloadRecord({
    downloadConfig: generateDownloadConfig(),
    downloadId: faker.number.int(),
    recordedAt: faker.date.past(),
    tweetInfo: generateTweetInfo(),
  })
