import path from 'path'

import { fetchFileNameSetting } from '../src/helpers/storageHelper'
import { makeBrowserDownloadConfig } from '../src/utils/maker'
import { TwitterMediaFile, makeOrigSrc } from '../src/libs/TwitterMediaFile'
import { DEFAULT_DIRECTORY } from '../src/constants'

// mocking field
jest.mock('../src/helpers/storageHelper')

const someHost = 'https://pbs.twimg.com/media/'
const defaultDirectory = 'twitter_media_harvest'
const fileName = '132488ER234'
const fileExt = '.jpg'
const fileIndex = 2
const fileUrl = `${someHost}${fileName}${fileExt}`
const tweetInfo = {
  screenName: 'twitter_user',
  tweetId: 'tweetId',
}
const expectFileInfo = {
  ...tweetInfo,
  url: `${someHost}${fileName}${fileExt}`,
  src: `${someHost}${fileName}${fileExt}:orig`,
  name: fileName,
  ext: fileExt,
  order: String(fileIndex + 1),
}
const expectFileName = path.format({
  root: `${defaultDirectory}/`,
  name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-0${expectFileInfo.order}`,
  ext: fileExt,
})
const twitterMediaFile = new TwitterMediaFile(tweetInfo, fileUrl, fileIndex)

describe('Elementary test', () => {
  it('Processing original source url', () => {
    const origSrc = makeOrigSrc(fileUrl)
    expect(origSrc).toBe(expectFileInfo.src)
  })

  it('Parsing file information from file url', () => {
    expect(twitterMediaFile).toEqual(expectFileInfo)
  })

  it('Make chrome download config', () => {
    const expectConfig = {
      url: expectFileInfo.src,
      filename: expectFileName,
      conflictAction: 'overwrite',
      saveAs: false,
    }
    const theConfig = makeBrowserDownloadConfig(
      expectFileInfo.src,
      expectFileName
    )
    expect(theConfig).toEqual(expectConfig)
  })
})

describe('Test filename pattern', () => {
  const makeSetting = jest.fn((needAccount, serial) => {
    return {
      directory: DEFAULT_DIRECTORY,
      filename_pattern: {
        account: needAccount,
        serial: serial,
      },
    }
  })

  it('account with order (default)', async () => {
    const defaultSetting = makeSetting(true, 'order')

    fetchFileNameSetting.mockReturnValue(Promise.resolve(defaultSetting))
    const patternSetting = await fetchFileNameSetting()

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(expectFileName)
  })

  it('account with basename', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-${expectFileInfo.name}`,
      ext: fileExt,
    })
    const defaultSetting = makeSetting(true, 'file_name')

    fetchFileNameSetting.mockReturnValue(Promise.resolve(defaultSetting))
    const patternSetting = await fetchFileNameSetting()

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })

  it('account-less with order', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.tweetId}-0${expectFileInfo.order}`,
      ext: fileExt,
    })
    const defaultSetting = makeSetting(false, 'order')

    fetchFileNameSetting.mockReturnValue(Promise.resolve(defaultSetting))
    const patternSetting = await fetchFileNameSetting()

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })

  it('account-less with basename', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.tweetId}-${expectFileInfo.name}`,
      ext: fileExt,
    })
    const defaultSetting = makeSetting(false, 'file_name')

    fetchFileNameSetting.mockReturnValue(Promise.resolve(defaultSetting))
    const patternSetting = await fetchFileNameSetting()

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })
})

jest.restoreAllMocks()
