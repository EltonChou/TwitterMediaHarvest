import { isValidTweetMediaFileUrl } from '@backend/downloads/utils/checker'

test('Tweet Media File Url Checker', () => {
  expect(isValidTweetMediaFileUrl('https://pbs.twimg.com/media/IMAGE.jpg')).toBeTruthy()
  expect(
    isValidTweetMediaFileUrl(
      'https://video.twimg.com/ext_tw_video/123/pu/vid/1280x720/video.mp4'
    )
  ).toBeTruthy()
  expect(
    isValidTweetMediaFileUrl(
      'https://pbs.twimg.com/ext_tw_video_thumb/123/pu/img/THUMBNAIL.jpg'
    )
  ).toBeTruthy()
})
