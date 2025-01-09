import MediaType from '#enums/mediaType'
import { downloadIDB } from '#libs/idb/download/db'
import type { DownloadHistoryItem } from '#libs/idb/download/schema'
import { SearchDownloadHistoryFromIDB } from './searchDownloadHistoryFromIDB'
import { faker } from '@faker-js/faker/locale/en'

describe('integrated test for searching download history from indexedDB.', () => {
  const useCase = new SearchDownloadHistoryFromIDB(downloadIDB)

  beforeAll(async () => {
    const items: DownloadHistoryItem[] = [
      {
        displayName: 'cool guy',
        screenName: 'cool_guy_really',
        downloadTime: faker.date.recent(),
        hashtags: new Set(['a', 'b', 'c']),
        mediaType: MediaType.Mixed,
        thumbnail: faker.image.url(),
        tweetId: '1',
        tweetTime: faker.date.recent(),
        userId: faker.string.numeric(),
      },
    ]
    const context = await downloadIDB.prepareTransaction('history', 'readwrite')

    const collection = context.tx.objectStore('history')
    for (const item of items) {
      collection.put(item)
    }

    context.completeTx()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    const client = await downloadIDB.connect()
    await client.clear('history')
  })

  it('can search download history', async () => {
    const result = await useCase.process({
      limit: 10,
      skip: 0,
      filters: [({ screenName }) => screenName.includes('guy')],
      orderBy: { key: 'downloadTime', type: 'desc' },
    })

    expect(result.error).toBeUndefined()
    expect(result.items.length).toBe(1)
    expect(result.matchedCount).toBe(1)
  })
})
