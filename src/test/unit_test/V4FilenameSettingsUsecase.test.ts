import V4FilenameSettingsUsecase, { type FileInfo } from '@backend/settings/filenameSettings/usecase'
import path from 'path'
import type { V4FilenameSettings } from '@schema'

describe('Filename usecase unit test', () => {
  const fileInfo: FileInfo = {
    account: 'user',
    tweetId: '123456',
    serial: 3,
    hash: '14y8vn8',
    date: new Date(2222, 2, 2),
  }

  const settings: () => V4FilenameSettings = () => ({
    directory: 'dir',
    noSubDirectory: false,
    filenamePattern: ['{account}', '{tweetId}', '{serial}'],
  })

  it('can make fullpath of file', () => {
    const usecase = new V4FilenameSettingsUsecase(settings())

    const fp = usecase.makeFullPathWithFilenameAndExt('123', '.jpg')
    expect(fp).toEqual(path.format({ dir: 'dir', name: '123', ext: '.jpg' }))
  })

  it('can make file name with account', () => {
    const s = settings()
    s.filenamePattern = ['{account}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(fileInfo)
    expect(filename).toBe(fileInfo.account)
  })

  it('can make file name with tweetId', () => {
    const s = settings()
    s.filenamePattern = ['{tweetId}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(fileInfo)
    expect(filename).toBe(fileInfo.tweetId)
  })

  it('can make file name with serial', () => {
    const s = settings()
    s.filenamePattern = ['{serial}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(fileInfo)
    expect(filename).toBe(String(fileInfo.serial).padStart(2, '0'))
  })

  it('can make file name with hash', () => {
    const s = settings()
    s.filenamePattern = ['{hash}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(fileInfo)
    expect(filename).toBe(fileInfo.hash)
  })

  it('can make file name with date', () => {
    const s = settings()
    s.filenamePattern = ['{date}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(fileInfo)
    expect(filename).toBe('22220302')
  })
})
