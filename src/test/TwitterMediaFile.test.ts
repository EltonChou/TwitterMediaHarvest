import path from 'path'
import TwitterMediaFile, { DownloadMode } from '../backend/downloads/TwitterMediaFile'

const DEFAULT_DIRECTORY = 'twitter_media_harvest'
const defaultFilenameSetting: V4FilenameSettings = {
  directory: DEFAULT_DIRECTORY,
  noSubDirectory: false,
  filenamePattern: ['{account}', '{tweetId}', '{serial}'],
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
        ext: '.jpg',
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
        ext: '.mp4',
      }),
      referrer: `https://twitter.com/i/web/status/${tweetInfo.tweetId}`,
      options: {},
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
    expect(TwitterMediaFile.isValidFileUrl('https://pbs.twimg.com/media/safdzh.jpg')).toBeTruthy()
    expect(TwitterMediaFile.isValidFileUrl('https://pbs.twimg.com/media/safdzhzh.jpg:orig')).toBeFalsy()
    expect(
      TwitterMediaFile.isValidFileUrl(
        'https://video.twimg.com/amplify_video/5465465465415/vid/1440x720/adsfasdfasdf.mp4'
      )
    ).toBeTruthy()
  })
})
