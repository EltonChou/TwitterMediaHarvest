import PatternToken from '#enums/patternToken'
import { generateTweetMediaFile } from '#utils/test/tweetMediaFile'
import { FilenameSetting } from './filenameSetting'

describe('unit test for filename settings', () => {
  it('can make full path with filename with ext', () => {
    const filenameSetting = new FilenameSetting({
      directory: 'sub',
      groupBy: '{account}',
      fileAggregation: true,
      noSubDirectory: false,
      filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
    })
    const mediaFile = generateTweetMediaFile()
    const fullPath = filenameSetting.makeFilename(mediaFile)

    const directory = filenameSetting.mapBy(props => props.directory)
    const { tweetId, serial, ext } = mediaFile.mapBy(props => props)
    const { screenName } = mediaFile.mapBy(props => props.tweetUser.mapBy(props => props))

    expect(fullPath).toBe(
      `${directory}/${screenName}/${screenName}-${tweetId}-${String(serial).padStart(
        2,
        '0'
      )}${ext}`
    )
  })

  it('can make full path without sub-directory', () => {
    const filenameSetting = new FilenameSetting({
      directory: 'sub',
      groupBy: '{account}',
      fileAggregation: true,
      noSubDirectory: true,
      filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
    })
    const mediaFile = generateTweetMediaFile()
    const fullPath = filenameSetting.makeFilename(mediaFile)

    const { tweetId, serial, ext } = mediaFile.mapBy(props => props)
    const { screenName } = mediaFile.mapBy(props => props.tweetUser.mapBy(props => props))

    expect(fullPath).toBe(
      `${screenName}/${screenName}-${tweetId}-${String(serial).padStart(2, '0')}${ext}`
    )
  })
})
