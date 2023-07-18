import { isValidTweetMediaFileUrl } from '@backend/downloads/utils/checker'
import { TweetMediaFileVO } from '@backend/downloads/valueObjects'

const VIDEO_URL_BASE = 'https://pbs.twimg.com/tw_video/'
const IMAGE_URL_BASE = 'https://pbs.twimg.com/media/'

describe('Test TwitterMediaFile usage.', () => {
  const pngFile = new TweetMediaFileVO(IMAGE_URL_BASE.concat('cool.png'), 0)
  const jpgFile = new TweetMediaFileVO(IMAGE_URL_BASE.concat('cool.jpg'), 0)
  const mp4File = new TweetMediaFileVO(VIDEO_URL_BASE.concat('hq.mp4'), 0)

  it('can detect the file is video', () => {
    expect(mp4File.isVideo()).toBeTruthy()
  })

  it('can detect the file is image', () => {
    expect(pngFile.isVideo()).toBeFalsy()
    expect(jpgFile.isVideo()).toBeFalsy()
  })

  it('can validate url', () => {
    expect(
      isValidTweetMediaFileUrl('https://video.twimg.com/ext_tw_video/30754565/pu/vid/720x1018/asdf.mp4')
    ).toBeTruthy()
    expect(
      isValidTweetMediaFileUrl('https://video.twimg.com/ext_tw_video/30754565/pu/vid/720x1018/asdf.mp4?tag=21')
    ).toBeFalsy()
    expect(isValidTweetMediaFileUrl('https://pbs.twimg.com/media/safdzh.jpg')).toBeTruthy()
    expect(isValidTweetMediaFileUrl('https://pbs.twimg.com/media/safdzhzh.jpg:orig')).toBeFalsy()
    expect(
      isValidTweetMediaFileUrl('https://video.twimg.com/amplify_video/5465465465415/vid/1440x720/adsfasdfasdf.mp4')
    ).toBeTruthy()
  })
})
