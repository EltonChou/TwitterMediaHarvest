import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import ConflictAction from '#enums/ConflictAction'
import { BrowserDownloadFile } from './browerDownloadFile'
import { faker } from '@faker-js/faker/locale/en'
import { downloads, runtime } from 'webextension-polyfill'

describe('unit test for browser download file use case', () => {
  const useCase = new BrowserDownloadFile()

  afterEach(() => jest.resetAllMocks())

  it('can download file properly', async () => {
    const mockDownload = jest.spyOn(downloads, 'download').mockResolvedValue(1)

    const target = new DownloadConfig({
      conflictAction: ConflictAction.Prompt,
      filename: 'filename',
      saveAs: true,
      url: faker.internet.url(),
    })

    await useCase.process({ target: target })

    expect(mockDownload).toHaveBeenCalledTimes(1)
  })

  it('can will return Error if the download was failed', async () => {
    const mockDownload = jest
      .spyOn(downloads, 'download')
      .mockResolvedValue(undefined as unknown as number)

    runtime.lastError = new Error('nope')

    const target = new DownloadConfig({
      conflictAction: ConflictAction.Prompt,
      filename: 'filename',
      saveAs: true,
      url: faker.internet.url(),
    })

    const downloadError = await useCase.process({ target: target })

    expect(mockDownload).toHaveBeenCalledTimes(1)
    expect(downloadError instanceof Error).toBeTruthy()
  })
})
