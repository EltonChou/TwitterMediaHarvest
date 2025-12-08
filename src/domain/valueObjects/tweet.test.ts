import { generateTweetUser } from '#utils/test/tweetUser'
import { Tweet } from './tweet'
import { TweetMedia } from './tweetMedia'

describe('Tweet value object', () => {
  it('medias returns all images and videos', () => {
    const user = generateTweetUser()
    const images = [
      new TweetMedia({
        index: 0,
        type: 'photo',
        url: 'https://foo.bar/img1.png',
        available: true,
      }),
    ]
    const videos = [
      new TweetMedia({
        index: 1,
        type: 'video',
        url: 'https://foo.bar/vid1.mp4',
        available: true,
      }),
    ]

    const tweet = new Tweet({
      id: '1234',
      createdAt: new Date(),
      hashtags: [],
      user,
      images,
      videos,
    })

    expect(tweet.medias).toHaveLength(2)
    expect(tweet.medias[0]).toBe(images[0])
    expect(tweet.medias[1]).toBe(videos[0])
  })

  it('availableMedias excludes unavailable media', () => {
    const user = generateTweetUser()
    const images = [
      new TweetMedia({
        index: 0,
        type: 'photo',
        url: 'https://foo.bar/img1.png',
        available: true,
      }),
      new TweetMedia({
        index: 1,
        type: 'thumbnail',
        url: 'https://foo.bar/thumb.png',
        available: false,
      }),
    ]
    const videos = [
      new TweetMedia({
        index: 2,
        type: 'video',
        url: 'https://foo.bar/vid1.mp4',
        available: true,
      }),
      new TweetMedia({
        index: 3,
        type: 'video',
        url: 'https://foo.bar/vid2.mp4',
        available: false,
      }),
    ]

    const tweet = new Tweet({
      id: '1234',
      createdAt: new Date(),
      hashtags: [],
      user,
      images,
      videos,
    })

    expect(tweet.availableMedias).toHaveLength(2)
    expect(tweet.availableMedias[0]).toBe(images[0])
    expect(tweet.availableMedias[1]).toBe(videos[0])
  })

  it('availableMedias returns empty array when all media are unavailable', () => {
    const user = generateTweetUser()
    const images = [
      new TweetMedia({
        index: 0,
        type: 'photo',
        url: 'https://foo.bar/img1.png',
        available: false,
      }),
    ]
    const videos = [
      new TweetMedia({
        index: 1,
        type: 'video',
        url: 'https://foo.bar/vid1.mp4',
        available: false,
      }),
    ]

    const tweet = new Tweet({
      id: '1234',
      createdAt: new Date(),
      hashtags: [],
      user,
      images,
      videos,
    })

    expect(tweet.availableMedias).toHaveLength(0)
  })
})
