import { parseMedias } from './tweetMedia'

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
