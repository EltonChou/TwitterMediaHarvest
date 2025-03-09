import { downloadIDB } from '#libs/idb/download/db'
import { generateDownloadHistory } from '#utils/test/downloadHistory'
import { generateDownloadHistoryItem } from '#utils/test/downloadHistoryItem'
import { IDBPortableDownloadHistoryRepository } from './IDBPortableDownloadHistory'
import { faker } from '@faker-js/faker/locale/en'

describe('unit test for indexedDB portable download history repository', () => {
  const mockBlobToUrl = jest.fn().mockResolvedValue('data-url')
  const repo = new IDBPortableDownloadHistoryRepository(downloadIDB)

  beforeEach(async () => {
    const { tx, completeTx } = await downloadIDB.prepareTransaction(
      ['hashtag', 'history'],
      'readwrite'
    )

    tx.objectStore('history').put(generateDownloadHistoryItem())
    tx.objectStore('hashtag').put({
      name: 'beast',
      tweetIds: new Set(['1145141919810']),
    })

    completeTx()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('can export history and return url of exported file', async () => {
    const { value: url, error } = await repo.export(mockBlobToUrl)

    expect(mockBlobToUrl).toHaveBeenCalled()
    expect(error).toBeUndefined()
    expect(url).toBeDefined()
  })

  it('can import history', async () => {
    const histories = faker.helpers.multiple(generateDownloadHistory, {
      count: 10,
    })
    const importError = await repo.import(histories)

    expect(importError).toBeUndefined()
    const { tx, completeTx } = await downloadIDB.prepareTransaction(
      ['hashtag', 'history'],
      'readonly'
    )

    const historyCount = await tx.objectStore('history').count()
    const hashtags = await tx.objectStore('hashtag').getAllKeys()

    completeTx()

    // Check the existing items was not affected.
    expect(historyCount).toBeGreaterThanOrEqual(
      new Set(histories.map(history => history.id.value)).size
    )
    expect(hashtags).toContain('beast')
  })
})
