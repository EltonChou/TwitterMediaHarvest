import { Tweet } from '#domain/valueObjects/tweet'
import { TweetMedia } from '#domain/valueObjects/tweetMedia'
import { TweetMediaFile } from '#domain/valueObjects/tweetMediaFile'
import { generateTweetUser } from '#utils/test/tweetUser'
import { tweetToTweetMediaFiles } from './tweetToTweetMediaFiles'

describe('unit test for tweet to tweet media files factory', () => {
  it('can make tweet medias from tweet', () => {
    const tweetUser = generateTweetUser()
    const tweet = new Tweet({
      id: '1145141919810',
      user: tweetUser,
      createdAt: new Date(2222, 2, 2),
      hashtags: [],
      images: [
        new TweetMedia({
          index: 0,
          type: 'thumbnail',
          url: 'https://foo.bar/hash.png',
        }),
        new TweetMedia({
          index: 3,
          type: 'photo',
          url: 'https://foo.bar/hash.png',
        }),
      ],
      videos: [
        new TweetMedia({
          index: 1,
          type: 'video',
          url: 'https://foo.bar/hash.mp4?tag=12',
        }),
        new TweetMedia({
          index: 2,
          type: 'video',
          url: 'https://foo.bar/hash.mp4',
        }),
      ],
    })

    const tweetMediaFiles = tweetToTweetMediaFiles(tweet).sort(
      (a, b) => a.mapBy(props => props.serial) - b.mapBy(props => props.serial)
    )

    const expectedFiles = [
      new TweetMediaFile({
        createdAt: new Date(2222, 2, 2),
        ext: '.png',
        hash: 'hash',
        serial: 1,
        source: 'https://foo.bar/hash.png:orig',
        tweetId: '1145141919810',
        tweetUser: tweetUser,
        type: 'thumbnail',
      }),
      new TweetMediaFile({
        createdAt: new Date(2222, 2, 2),
        ext: '.mp4',
        hash: 'hash',
        serial: 2,
        source: 'https://foo.bar/hash.mp4?tag=12',
        tweetId: '1145141919810',
        tweetUser: tweetUser,
        type: 'video',
      }),
      new TweetMediaFile({
        createdAt: new Date(2222, 2, 2),
        ext: '.mp4',
        hash: 'hash',
        serial: 3,
        source: 'https://foo.bar/hash.mp4',
        tweetId: '1145141919810',
        tweetUser: tweetUser,
        type: 'video',
      }),
      new TweetMediaFile({
        createdAt: new Date(2222, 2, 2),
        ext: '.png',
        hash: 'hash',
        serial: 4,
        source: 'https://foo.bar/hash.png:orig',
        tweetId: '1145141919810',
        tweetUser: tweetUser,
        type: 'image',
      }),
    ]

    expect(tweetMediaFiles).toStrictEqual(expectedFiles)
  })
})
