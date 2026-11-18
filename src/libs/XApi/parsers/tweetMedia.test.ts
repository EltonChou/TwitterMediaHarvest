import { parseMedias } from './tweetMedia'

describe('parseMedias alt text parsing', () => {
  const gifVariants = [
    { bitrate: 0, content_type: 'video/mp4', url: 'https://foo.bar/c.mp4' },
  ] satisfies XApi.VideoVariant[]

  it.each([
    [
      'photo with alt text',
      {
        type: 'photo',
        media_url_https: 'https://foo.bar/a.png',
        ext_alt_text: 'a photo',
      },
      ['a photo'],
      [],
    ],
    [
      'photo without alt text',
      { type: 'photo', media_url_https: 'https://foo.bar/b.png' },
      [undefined],
      [],
    ],
    [
      'photo with null alt text',
      {
        type: 'photo',
        media_url_https: 'https://foo.bar/b.png',
        ext_alt_text: null,
      },
      [undefined],
      [],
    ],
    [
      'photo with empty alt text',
      {
        type: 'photo',
        media_url_https: 'https://foo.bar/b.png',
        ext_alt_text: '',
      },
      [undefined],
      [],
    ],
    [
      'video without alt text',
      {
        type: 'video',
        media_url_https: 'https://foo.bar/v.jpg',
        video_info: { variants: gifVariants },
      },
      [undefined],
      [undefined],
    ],
    [
      'gif with alt text',
      {
        type: 'animated_gif',
        media_url_https: 'https://foo.bar/c.jpg',
        ext_alt_text: 'a gif',
        video_info: { variants: gifVariants },
      },
      ['a gif'],
      ['a gif'],
    ],
  ] satisfies [
    string,
    XApi.Media,
    (string | undefined)[],
    (string | undefined)[],
  ][])('maps ext_alt_text to altText: %s', (_, media, imageAlts, videoAlts) => {
    const result = parseMedias([media])

    expect(result.images.map(m => m.mapBy(p => p.altText))).toEqual(imageAlts)
    expect(result.videos.map(m => m.mapBy(p => p.altText))).toEqual(videoAlts)
  })
})

describe('parseMedias availability parsing', () => {
  it('marks media unavailable when ext_media_availability.status === "Unavailable"', () => {
    const medias = [
      {
        type: 'photo',
        media_url_https: 'https://foo.bar/avail.png',
      },
      {
        type: 'photo',
        media_url_https: 'https://foo.bar/unavail.png',
        ext_media_availability: {
          reason: 'Dmcaed',
          status: 'Unavailable',
        },
      },
      {
        type: 'video',
        media_url_https: 'https://foo.bar/video.mp4',
        video_info: {
          variants: [
            {
              bitrate: 100,
              content_type: 'video/mp4',
              url: 'https://foo.bar/video.mp4',
            },
          ],
        },
      },
      {
        type: 'video',
        media_url_https: 'https://foo.bar/video_unavail.mp4',
        video_info: {
          variants: [
            {
              bitrate: 50,
              content_type: 'video/mp4',
              url: 'https://foo.bar/video_unavail.mp4',
            },
          ],
        },
        ext_media_availability: { status: 'Unavailable' },
      },
    ] satisfies XApi.Media[]

    const result = parseMedias(medias)

    const imageAvailabilities = result.images.map(m =>
      m.mapBy(p => p.available)
    )
    const videoAvailabilities = result.videos.map(m =>
      m.mapBy(p => p.available)
    )

    // Images includes video thumbnails, so expect 4 image entries (2 photos + 2 thumbnails)
    expect(imageAvailabilities).toEqual([true, false, true, false])
    expect(videoAvailabilities).toEqual([true, false])
  })
})
