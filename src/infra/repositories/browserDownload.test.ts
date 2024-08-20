import { BrowserDownloadRepository } from './browserDownload'
import { downloads } from 'webextension-polyfill'

describe('unit test for browser download repository', () => {
  const repo = new BrowserDownloadRepository()

  afterAll(() => jest.resetAllMocks())

  it('can get download item by download id', async () => {
    const mockSearch = jest.spyOn(downloads, 'search').mockResolvedValue([])
    await repo.getById(10)
    expect(mockSearch).toHaveBeenCalled()
  })

  it('can get download items by query', async () => {
    const mockSearch = jest.spyOn(downloads, 'search').mockResolvedValue([])
    await repo.search({ id: 10, limit: 10 })
    expect(mockSearch).toHaveBeenCalled()
  })
})
