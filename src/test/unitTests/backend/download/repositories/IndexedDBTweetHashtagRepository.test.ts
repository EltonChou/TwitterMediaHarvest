import { IndexedDBHashtagRepository } from '@backend/downloads/repositories'
import { faker } from '@faker-js/faker'
import { downloadDB } from '@libs/indexedDB'
import 'fake-indexeddb/auto'

describe('IndexedDBTagRepository unit test', () => {
  const repo = new IndexedDBHashtagRepository(async () => await downloadDB.connect())

  beforeEach(async () => {
    await repo.clear()
  })

  const generateFakeItems = async (): Promise<number> => {
    const tagSet = new Set<string>()
    for (let i = 0; i < faker.number.int({ min: 50, max: 100 }); i++) {
      const tag = faker.string.alpha(15)
      tagSet.add(tag)
    }
    const tweetIds = faker.string.numeric(13)
    await repo.addTweet(tweetIds)(...tagSet)
    return tagSet.size
  }

  it('can get all', async () => {
    const count = await generateFakeItems()
    const allItems = await repo.getAll()

    expect(allItems.length).toEqual(count)
  })

  it('can get tweet by tags', async () => {
    const tags = faker.helpers.uniqueArray(faker.lorem.word, 50)
    const tweetId = faker.string.numeric(13)
    await repo.addTweet(tweetId)(...tags)

    const tweetIds = await repo.getTweetsByTags(...faker.helpers.arrayElements(tags))
    expect(tweetIds).toContain(tweetId)
  })

  it('can add tweet to tag', async () => {
    const tags = faker.helpers.uniqueArray(faker.lorem.word, 50)
    const tweetId = faker.string.numeric(13)
    await repo.addTweet(tweetId)(...tags)

    const tweetIds = await repo.getTweetsByTag(faker.helpers.arrayElement(tags))
    expect(tweetIds).toContain(tweetId)
  })

  it('can get all tags', async () => {
    const tags = faker.helpers.uniqueArray(faker.lorem.word, 50)
    const tweetId = faker.string.numeric(13)
    await repo.addTweet(tweetId)(...tags)

    const fetchedTags = await repo.getAllTags()
    expect(fetchedTags.sort()).toEqual(tags.sort())
  })
})
