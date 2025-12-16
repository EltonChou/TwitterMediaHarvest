import { TweetMedia } from './tweetMedia'

describe('TweetMedia', () => {
  it('should identify video type', () => {
    const media = TweetMedia.create({
      type: 'video',
      index: 0,
      url: 'https://t.co/video.mp4',
    })
    expect(media.isVideo).toBe(true)
    expect(media.isThumbnail).toBe(false)
  })

  it('should identify thumbnail type', () => {
    const media = TweetMedia.create({
      type: 'thumbnail',
      index: 1,
      url: 'https://t.co/thumb.jpg',
    })
    expect(media.isThumbnail).toBe(true)
    expect(media.isVideo).toBe(false)
  })

  it('should get variant url for video (no change)', () => {
    const url = 'https://t.co/video.mp4'
    const media = TweetMedia.create({ type: 'video', index: 0, url })
    expect(media.getVariantUrl('large')).toBe(url)
  })

  it('should get variant url for thumbnail', () => {
    const url = 'https://t.co/thumb.jpg'
    const media = TweetMedia.create({ type: 'thumbnail', index: 0, url })
    expect(media.getVariantUrl('small')).toMatch(/thumb.jpg:small$/)
  })

  it('should get variant url for photo', () => {
    const url = 'https://pbs.twimg.com/media/abc123.jpg'
    const media = TweetMedia.create({ type: 'photo', index: 0, url })
    const result = media.getVariantUrl('medium')
    expect(result).toMatch(/media\/abc123\?format=jpg&name=medium$/)
  })

  it('should handle missing file extension (no change)', () => {
    const url = 'https://pbs.twimg.com/media/abc123'
    const media = TweetMedia.create({ type: 'photo', index: 0, url })
    expect(media.getVariantUrl('orig')).toBe(url)
  })
})
