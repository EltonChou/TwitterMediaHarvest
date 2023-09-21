import { DownloadHistoryEntity } from '@backend/downloads/models'
import { faker } from '@faker-js/faker'

const makeHistoryEntity = (): DownloadHistoryEntity =>
  DownloadHistoryEntity.build({
    tweetId: faker.string.numeric(13),
    userId: faker.string.numeric(13),
    displayName: faker.internet.displayName(),
    screenName: faker.internet.userName(),
    tweetTime: faker.date.past(),
    downloadTime: faker.date.past(),
    mediaType: faker.helpers.arrayElement(['image', 'video', 'mixed']),
  })

describe('DownloadHistoryEntity unit test', () => {
  it('can be stringified by JSON.stringify', () => {
    const entity = makeHistoryEntity()

    expect(JSON.stringify(entity)).toEqual(JSON.stringify(entity.toDownloadHistoryItem()))
  })
})
