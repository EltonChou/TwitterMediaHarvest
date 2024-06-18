import V4FilenameSettingsUsecase, {
  type FileInfo,
} from '@backend/settings/filenameSettings/usecase'
import type { V4FilenameSettings } from '@schema'
import path from 'path'

describe('Filename usecase unit test', () => {
  const tweetDetail: TweetDetail = {
    id: 'tweetId',
    displayName: 'display',
    userId: '123',
    createdAt: new Date(),
    screenName: 'screen_name',
  }
  const fileInfo: FileInfo = {
    serial: 3,
    hash: '14y8vn8',
    date: new Date(2222, 2, 2),
  }

  const settings: () => V4FilenameSettings = () => ({
    separator: '-',
    directory: 'dir',
    noSubDirectory: false,
    filenamePattern: ['{account}', '{tweetId}', '{serial}'],
    groupBy: '{account}',
    fileAggregation: false,
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
    const filename = usecase.makeFilename(tweetDetail, fileInfo)
    expect(filename).toBe(tweetDetail.screenName)
  })

  it('can make file name with tweetId', () => {
    const s = settings()
    s.filenamePattern = ['{tweetId}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(tweetDetail, fileInfo)
    expect(filename).toBe(tweetDetail.id)
  })

  it('can make file name with serial', () => {
    const s = settings()
    s.filenamePattern = ['{serial}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(tweetDetail, fileInfo)
    expect(filename).toBe(String(fileInfo.serial).padStart(2, '0'))
  })

  it('can make file name with hash', () => {
    const s = settings()
    s.filenamePattern = ['{hash}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(tweetDetail, fileInfo)
    expect(filename).toBe(fileInfo.hash)
  })

  it('can make file name with date', () => {
    const s = settings()
    s.filenamePattern = ['{date}']
    const usecase = new V4FilenameSettingsUsecase(s)
    const filename = usecase.makeFilename(tweetDetail, fileInfo)
    expect(filename).toBe('22220302')
  })

  it('can make aggregation directory', () => {
    const s: V4FilenameSettings = {
      ...settings(),
      fileAggregation: true,
      groupBy: '{account}',
    }
    const useCase = new V4FilenameSettingsUsecase(s)
    const aggregationDir = useCase.makeAggregationDirectory(tweetDetail)
    expect(aggregationDir).toBe(tweetDetail.screenName)
  })
})
