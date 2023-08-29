import { DownloadHistoryEntity } from '@backend/downloads/models'
import { IndexedDBDownloadHistoryRepository } from '@backend/downloads/repositories'
import { faker } from '@faker-js/faker'
import { downloadDB } from '@libs/indexedDB'
import 'fake-indexeddb/auto'

const makeHistoryItem = (): DownloadHistoryEntity =>
  DownloadHistoryEntity.build({
    tweetId: faker.string.numeric(13),
    userId: faker.string.numeric(13),
    displayName: faker.internet.displayName(),
    screenName: faker.internet.userName(),
    tweetTime: faker.date.past(),
    downloadTime: faker.date.past(),
    mediaType: faker.helpers.arrayElement(['image', 'video', 'mixed']),
  })

describe('IndexedDBDownloadHistoryRepository unit test', () => {
  const repo = new IndexedDBDownloadHistoryRepository(
    async () => await downloadDB.connect()
  )

  const generateFakeItems = async (): Promise<[DownloadHistoryEntity[], number]> => {
    const count = faker.number.int({ min: 50, max: 100 })
    const items = []
    for (let i = 0; i < count; i++) {
      const item = makeHistoryItem()
      items.push(item)
      await repo.save(item)
    }
    return [items, count]
  }

  const generateFakeItem = async () => {
    const item = makeHistoryItem()
    await repo.save(item)
    return item
  }

  beforeEach(async () => {
    await repo.clear()
  })

  it('can save download history item', async () => {
    const item = makeHistoryItem()
    await repo.save(item)
  })

  it('can get download history item by id', async () => {
    const item = await generateFakeItem()
    const fetchedItem = await repo.getByTweetId(item.id)
    expect(fetchedItem).toBeDefined()
  })

  it('can check item exists or not by id', async () => {
    const item = await generateFakeItem()
    expect(await repo.tweetHasDownloaded(item.id)).toBeTruthy()
    expect(await repo.tweetHasDownloaded(makeHistoryItem().id)).toBeFalsy()
  })

  it('can get all items', async () => {
    const [_, count] = await generateFakeItems()
    const items = await repo.getAll()
    expect(items.length).toEqual(count)
  })

  // it('can get latest 10 items', async () => {
  //   const [items, count] = await generateFakeItems()
  //   const fetchedItems = await repo.getLatest(10)
  //   expect(fetchedItems.length).toEqual(10)
  // })

  it('can get items by user name', async () => {
    const item = await generateFakeItem()
    const { displayName, screenName } = item.toDownloadHistoryItem()
    const byDisplayName = await repo.searchByUserName(displayName)
    const byScreenName = await repo.searchByUserName(screenName)
    expect(byDisplayName.length).toBeGreaterThan(0)
    expect(byScreenName.length).toBeGreaterThan(0)
  })

  // FIXME: Works fine on browser but failed on mocked idb.

  // it('can get items by download time', async () => {
  //   await generateFakeItems()
  //   const range = IDBKeyRange.upperBound(new Date())
  //   const items = await repo.searchByDownloadTime(range)
  //   expect(items.length).toEqual(10)
  // })

  // it('can get itmes by tweet time', async () => {
  //   await generateFakeItems()
  //   const range = IDBKeyRange.upperBound(new Date())
  //   const items = await repo.searchByTweetTime(range)
  //   expect(items.length).toEqual(10)
  // })
})
