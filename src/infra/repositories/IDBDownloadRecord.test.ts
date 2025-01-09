import { DownloadRecordNotFound } from '#domain/repositories/downloadRecord'
import { downloadIDB } from '#libs/idb/download/db'
import { DownloadDBSchema } from '#libs/idb/download/schema'
import { generateDownloadRecord } from '#utils/test/downloadRecord'
import { generateDownloadRecordItem } from '#utils/test/downloadRecordItem'
import { IDBDownloadRecordRepository } from './IDBDownloadRecord'
import { faker } from '@faker-js/faker/locale/en'
import { IDBPDatabase } from 'idb'

describe('integrated test for idb download record repository', () => {
  const repo = new IDBDownloadRecordRepository(downloadIDB)

  const downloadRecordItems = faker.helpers.multiple(
    generateDownloadRecordItem,
    {
      count: 10,
    }
  )

  beforeEach(async () => {
    const context = await downloadIDB.prepareTransaction('record', 'readwrite')

    await Promise.all(
      downloadRecordItems.map(item =>
        context.tx.objectStore('record').put(item)
      )
    )
    context.completeTx()
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    const client = await downloadIDB.connect()
    await client.clear('record')
  })

  it('can get download record', async () => {
    const { value: record, error: getError } = await repo.getById(
      faker.helpers.arrayElement(downloadRecordItems).id
    )

    expect(getError).toBeUndefined()
    expect(record).toBeDefined()

    const existIds = new Set(downloadRecordItems.map(item => item.id))

    let isPass = false
    while (isPass) {
      const id = faker.number.int()
      const shouldFound = !existIds.has(id)
      const { error: notFoundError } = await repo.getById(id)
      expect(notFoundError instanceof DownloadRecordNotFound).toBe(!shouldFound)
      isPass = !shouldFound
    }
  })

  it('can save download record', async () => {
    const error = await repo.save(generateDownloadRecord())

    expect(error).toBeUndefined()
  })

  it('can delete download record', async () => {
    const error = await repo.removeById(
      faker.helpers.arrayElement(downloadRecordItems).id
    )

    expect(error).toBeUndefined()
  })

  it('can handle connect error', async () => {
    jest.spyOn(downloadIDB, 'connect').mockImplementation(() => {
      throw new Error()
    })

    const saveError = await repo.save(generateDownloadRecord())
    expect(saveError).toBeDefined()

    const getError = await repo.getById(1)
    expect(getError).toBeDefined()

    const removeError = await repo.removeById(1)
    expect(removeError).toBeDefined()
  })

  it('can handle operation error', async () => {
    const errorFunc = () => {
      throw new Error()
    }
    jest.spyOn(downloadIDB, 'connect').mockResolvedValue({
      put: errorFunc,
      delete: errorFunc,
      get: errorFunc,
    } as unknown as IDBPDatabase<DownloadDBSchema>)

    const saveError = await repo.save(generateDownloadRecord())
    expect(saveError).toBeDefined()

    const getError = await repo.getById(1)
    expect(getError).toBeDefined()

    const removeError = await repo.removeById(1)
    expect(removeError).toBeDefined()
  })
})
