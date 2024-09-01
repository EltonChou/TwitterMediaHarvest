import { downloadIDB } from '#libs/idb/download/db'
import { generateDownloadHistory } from '#utils/test/downloadHistory'
import { IDBDownloadHistoryRepository } from './IDBDownloadHistory'
import { faker } from '@faker-js/faker/locale/en'

describe('integrated test for IDBDownloadHistoryRepository', () => {
  const repo = new IDBDownloadHistoryRepository(downloadIDB)
  const downloadHistory = generateDownloadHistory()

  afterEach(async () => {
    await repo.clear()
  })

  it('can save download history', async () => {
    const error = await repo.save(downloadHistory)

    expect(error).toBeUndefined()
  })

  it('can get download history', async () => {
    await repo.save(downloadHistory)
    const { value: fetchedDownloadHistory, error } = await repo.getByTweetId(
      downloadHistory.id.value
    )

    expect(error).toBeUndefined()
    expect(fetchedDownloadHistory).toBeDefined()
    expect(fetchedDownloadHistory?.is(downloadHistory)).toBeTruthy()
  })

  it('can get total stats', async () => {
    await repo.save(downloadHistory)
    const { value: stats, error } = await repo.total()

    expect(error).toBeUndefined()
    expect(stats?.historyTotal).toBe(1)
    expect(stats?.hashtagTotal).toBeGreaterThan(0)
  })

  it('can remove download history', async () => {
    await repo.save(downloadHistory)
    await repo.removeByTweetId(downloadHistory.id.value)
    const { value: fetchedDownloadHistory } = await repo.getByTweetId(
      downloadHistory.id.value
    )
    const { value: stats } = await repo.total()

    expect(fetchedDownloadHistory).toBeUndefined()
    expect(stats?.historyTotal).toBe(0)
    expect(stats?.hashtagTotal).toBe(
      downloadHistory.mapBy((_, props) => props.hashtags.length)
    )
  })

  it('can clear repository', async () => {
    await repo.save(downloadHistory)
    await repo.clear()
    const { value: stats } = await repo.total()

    expect(stats?.historyTotal).toBe(0)
    expect(stats?.hashtagTotal).toBe(0)
  })

  it('can check tweet id is existing', async () => {
    await repo.save(downloadHistory)
    const result = await repo.hasTweetId(downloadHistory.id.value)
    expect(result.value).toBeTruthy()

    let notDownloadedId = ''

    while (!notDownloadedId) {
      const id = faker.string.numeric()
      notDownloadedId = id !== downloadHistory.id.value ? id : ''
    }

    const anotherResult = await repo.hasTweetId(notDownloadedId)
    expect(anotherResult.value).not.toBeTruthy()
  })
})
