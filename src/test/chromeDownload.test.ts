import { jest } from '@jest/globals'
import path from 'path'

jest.useFakeTimers()

// import { fetchFileNameSetting } from '../src/helpers/storageHelper'
import { makeBrowserDownloadConfig } from '../utils/maker'
import { TwitterMediaFile, makeOrigSrc } from '../libs/TwitterMediaFile'
import { DEFAULT_DIRECTORY } from '../constants'
import { FilenameSetting } from '../typings'

// mocking field
jest.mock('../helpers/storageHelper')

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
  const makeSetting = jest.fn(
    (
      needAccount: boolean,
      serial: 'order' | 'file_name',
      no_sub_dir: boolean
    ): FilenameSetting => {
      return {
        directory: DEFAULT_DIRECTORY,
        no_subdirectory: no_sub_dir,
        filename_pattern: {
          account: needAccount,
          serial: serial,
        },
      }
    }
  )

  it('account with order (default)', async () => {
    const patternSetting = makeSetting(true, 'order', false)

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(expectFileName)
  })

  it('account with basename', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-${expectFileInfo.name}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(true, 'file_name', false)

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })

  it('account-less with order', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.tweetId}-0${expectFileInfo.order}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(false, 'order', false)

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })

  it('account-less with basename', async () => {
    const thisName = path.format({
      root: `${defaultDirectory}/`,
      name: `${tweetInfo.tweetId}-${expectFileInfo.name}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(false, 'file_name', false)

    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })

  it('no-subdirectory', async () => {
    const thisName = path.format({
      root: '',
      name: `${tweetInfo.tweetId}-${expectFileInfo.name}`,
      ext: fileExt,
    })

    const patternSetting = makeSetting(false, 'file_name', true)
    const fileName = twitterMediaFile.makeFileNameBySetting(patternSetting)

    expect(fileName).toBe(thisName)
  })
})

jest.restoreAllMocks()
