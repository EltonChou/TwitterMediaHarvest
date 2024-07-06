import type { FileInfo } from '#domain/useCases/makeMediaFileFullPath'
import { MakeMediaFileFullPath } from '#domain/useCases/makeMediaFileFullPath'
import PatternToken from '#enums/patternToken'
import { V4FilenameSettingsRepository } from '#infra/repositories/filenameSettings'
import { InMemoryStorageProxy } from '#libs/proxy'
import type { V4FilenameSettings } from '#schema'

describe('unit test for media filename use case.', () => {
  const v4FilenameRepo = new V4FilenameSettingsRepository(new InMemoryStorageProxy())

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
    ext: '.jpg',
  }

  const settings: V4FilenameSettings = {
    directory: 'downloads',
    noSubDirectory: false,
    filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
    groupBy: '{account}',
    fileAggregation: false,
  }

  afterEach(() => jest.clearAllMocks())

  it('can make full path with filename with ext', async () => {
    jest
      .spyOn(v4FilenameRepo, 'get')
      .mockResolvedValue({ ...settings, fileAggregation: true, groupBy: '{account}' })

    const filenameUseCase = new MakeMediaFileFullPath(v4FilenameRepo)
    const fullPath = await filenameUseCase.process({ tweetDetail, fileInfo })

    expect(fullPath).toBe(
      `${settings.directory}/${tweetDetail.screenName}/${tweetDetail.screenName}-${
        tweetDetail.id
      }-${String(fileInfo.serial).padStart(2, '0')}${fileInfo.ext}`
    )
  })
})
