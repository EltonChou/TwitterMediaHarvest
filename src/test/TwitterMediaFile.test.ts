import path from 'path'
import { jest } from '@jest/globals'
import TwitterMediaFile, { DownloadMode, FilenameSerialRule } from '../backend/libs/TwitterMediaFile'

const DEFAULT_DIRECTORY = 'twitter_media_harvest'
const defaultFilenameSetting: FilenameSetting = {
  directory: DEFAULT_DIRECTORY,
  no_subdirectory: false,
  filename_pattern: {
    account: true,
    serial: FilenameSerialRule.Order
  }
}
const VIDEO_URL_BASE = 'https://pbs.twimg.com/tw_video/'
const IMAGE_URL_BASE = 'https://pbs.twimg.com/media/'
const tweetInfo: TweetInfo = {
  screenName: 'twitter_user',
  tweetId: 'tweetId',
}


describe('Test TwitterMediaFile usage.', () => {
  const pngFile = new TwitterMediaFile(tweetInfo, IMAGE_URL_BASE.concat('cool.png'))
  const jpgFile = new TwitterMediaFile(tweetInfo, IMAGE_URL_BASE.concat('cool.jpg'))
  const mp4File = new TwitterMediaFile(tweetInfo, VIDEO_URL_BASE.concat('hq.mp4'))

  it('can detect the file is video', () => {
    expect(mp4File.isVideo()).toBeTruthy()
  })

  it('can detect the file is image', () => {
    expect(pngFile.isVideo()).toBeFalsy()
    expect(jpgFile.isVideo()).toBeFalsy()
  })

  it('can make valid chrome download config', () => {
    const expectConfig: chrome.downloads.DownloadOptions = {
      url: IMAGE_URL_BASE.concat('cool.jpg:orig'),
      filename: path.format({
        dir: DEFAULT_DIRECTORY,
        name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-01`,
        ext: '.jpg'
      }),
      conflictAction: 'overwrite',
      saveAs: false,
    }

    const theConfig = jpgFile.makeDownloadConfigBySetting(defaultFilenameSetting, DownloadMode.Browser)
    expect(theConfig).toEqual(expectConfig)
  })

  it('can make valid aria2 download config', () => {
    const expectConfig: Aria2DownloadOption = {
      url: VIDEO_URL_BASE.concat('hq.mp4'),
      filename: path.format({
        dir: DEFAULT_DIRECTORY,
        name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-01`,
        ext: '.mp4'
      }),
      referrer: `https://twitter.com/i/web/status/${tweetInfo.tweetId}`,
      options: {}
    }

    const theConfig = mp4File.makeDownloadConfigBySetting(defaultFilenameSetting, DownloadMode.Aria2)
    expect(theConfig).toEqual(expectConfig)
  })

  it('can validate url', () => {
    expect(
      TwitterMediaFile.isValidFileUrl('https://video.twimg.com/ext_tw_video/30754565/pu/vid/720x1018/asdf.mp4')
    ).toBeTruthy()
    expect(
      TwitterMediaFile.isValidFileUrl('https://video.twimg.com/ext_tw_video/30754565/pu/vid/720x1018/asdf.mp4?tag=21')
    ).toBeFalsy()
    expect(
      TwitterMediaFile.isValidFileUrl('https://pbs.twimg.com/media/safdzh.jpg')
    ).toBeTruthy()
    expect(
      TwitterMediaFile.isValidFileUrl('https://pbs.twimg.com/media/safdzhzh.jpg:orig')
    ).toBeFalsy()
  })
})



describe('Test different filename pattern.', () => {
  const fileExt = '.jpg'
  const basename = 'sss'
  const filename = basename.concat(fileExt)
  const fileIndex = 3
  const makeSetting = jest.fn(
    (
      needAccount: boolean,
      serial: FilenameSerialRule,
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
  const twitterMediaFile = new TwitterMediaFile(tweetInfo, IMAGE_URL_BASE.concat(filename), fileIndex)

  it('can be account with serial in order (by default).', () => {
    const thisFilename = path.format({
      dir: `${DEFAULT_DIRECTORY}`,
      name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-0${fileIndex + 1}`,
      ext: fileExt
    })
    const patternSetting = makeSetting(true, FilenameSerialRule.Order, false)
    const fileName = twitterMediaFile.makeFileFullPathBySetting(patternSetting)

    expect(fileName).toBe(thisFilename)
  })

  it('can be account with serial in original filename', () => {
    const thisFilename = path.format({
      dir: `${DEFAULT_DIRECTORY}`,
      name: `${tweetInfo.screenName}-${tweetInfo.tweetId}-${basename}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(true, FilenameSerialRule.Filename, false)
    const fileName = twitterMediaFile.makeFileFullPathBySetting(patternSetting)

    expect(fileName).toBe(thisFilename)
  })

  it('can be serial in order without account', () => {
    const thisFilename = path.format({
      dir: `${DEFAULT_DIRECTORY}`,
      name: `${tweetInfo.tweetId}-0${fileIndex + 1}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(false, FilenameSerialRule.Order, false)
    const fileName = twitterMediaFile.makeFileFullPathBySetting(patternSetting)

    expect(fileName).toBe(thisFilename)
  })

  it('can be serial in file basename without account', async () => {
    const thisFilename = path.format({
      dir: `${DEFAULT_DIRECTORY}`,
      name: `${tweetInfo.tweetId}-${basename}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(false, FilenameSerialRule.Filename, false)
    const fileName = twitterMediaFile.makeFileFullPathBySetting(patternSetting)

    expect(fileName).toBe(thisFilename)
  })

  it('can be no-subdirectory', async () => {
    const thisFilename = path.format({
      root: '',
      name: `${tweetInfo.tweetId}-${basename}`,
      ext: fileExt,
    })
    const patternSetting = makeSetting(false, FilenameSerialRule.Filename, true)
    const fileName = twitterMediaFile.makeFileFullPathBySetting(patternSetting)

    expect(fileName).toBe(thisFilename)
  })
})