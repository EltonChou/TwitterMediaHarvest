import { DownloadRecordItem } from '#libs/idb/download/schema'
import { faker } from '@faker-js/faker'

export const generateDownloadRecordItem = (): DownloadRecordItem => ({
  conflictAction: 'overwrite',
  filename: faker.system.fileName(),
  id: faker.number.int(),
  recordedAt: faker.date.past().getTime(),
  saveAs: faker.datatype.boolean(),
  url: faker.internet.url(),
  tweetInfo: {
    screenName: faker.internet.userName(),
    tweetId: faker.string.numeric(),
  },
})
