import { downloadIDB } from '#libs/idb/download/db'
import type { HashtagItem } from '#libs/idb/download/schema'
import { SearchTweetIdsByHashtagsFromIDB } from './searchTweetIdsByHashtagsFromIDB'

describe('integrated test for searching tweet ids by hashtags from idb', () => {
  const useCase = new SearchTweetIdsByHashtagsFromIDB(downloadIDB)

  beforeAll(async () => {
    const hashtagItems: HashtagItem[] = [
      { name: 'a', tweetIds: new Set(['1', '2', '3']) },
      { name: 'b', tweetIds: new Set(['3']) },
      { name: 'c', tweetIds: new Set(['2', '3']) },
      { name: 'd', tweetIds: new Set() },
    ]
    const context = await downloadIDB.prepareTransaction('hashtag', 'readwrite')

    const collection = context.tx.objectStore('hashtag')
    for (const item of hashtagItems) {
      collection.put(item)
    }

    context.completeTx()
  })

  afterAll(async () => {
    const client = await downloadIDB.connect()
    await client.clear('hashtag')
  })

  it.each([
    { hashtags: ['e'], expectIds: [] },
    { hashtags: ['a'], expectIds: ['1', '2', '3'] },
    { hashtags: ['d', 'a', 'c'], expectIds: [] },
    { hashtags: ['a', 'c'], expectIds: ['2', '3'] },
    { hashtags: ['a', 'b', 'c'], expectIds: ['3'] },
    { hashtags: [], expectIds: [] },
  ])(
    'can search with hashtags: $hashtags and expect ids: $expectIds',
    async ({ hashtags, expectIds }) => {
      const { value, error } = await useCase.process({ hashtags })

      expect(error).toBeUndefined()
      expect(value ? Array.from(value) : []).toEqual(expectIds)
    }
  )
})
