import PatternToken from '#enums/patternToken'
import { generateTweetMediaFile } from '#utils/test/tweetMediaFile'
import { FilenameSetting } from './filenameSetting'
import { faker } from '@faker-js/faker/locale/en'

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

  it.each([
    {
      directory: faker.system.directoryPath(),
      isValid: false,
      description: 'directory cannot starts with `/`',
    },
    {
      directory: faker.system.directoryPath().substring(1),
      isValid: true,
      description: 'valid directory should be valid',
    },
    {
      directory: 'directory_with_invalid_character???<>!@',
      isValid: false,
      description: 'directory should not contains reserved characters: `<>:"\\|?*`',
    },
    {
      directory: 'd'.repeat(4097),
      isValid: false,
      description: 'directory should not greater than 4096 characters',
    },
    {
      directory: '..',
      isValid: false,
      description: 'directory should no contains illegal characters',
    },
  ])('$description', ({ directory, isValid }) => {
    const filenameSetting = new FilenameSetting({
      directory: directory,
      groupBy: '{account}',
      fileAggregation: true,
      noSubDirectory: true,
      filenamePattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
    })

    const reason = filenameSetting.validate()
    isValid ? expect(reason).toBeUndefined() : expect(reason).toBeDefined()
  })

  it.each([
    {
      pattern: [PatternToken.Account, PatternToken.TweetId, PatternToken.Serial],
      isValid: true,
      description: 'pattern is unique with {tweetId} and {serial}',
    },
    {
      pattern: [PatternToken.Hash],
      isValid: true,
      description: 'pattern is unique with {hash}',
    },
    {
      pattern: faker.helpers.arrayElements([
        PatternToken.Account,
        PatternToken.AccountId,
        PatternToken.TweetTimestamp,
      ]),
      isValid: false,
      description: 'pattern might not be unique',
    },
  ])('$description', ({ pattern, isValid }) => {
    const filenameSetting = new FilenameSetting({
      directory: 'dir',
      groupBy: '{account}',
      fileAggregation: true,
      noSubDirectory: true,
      filenamePattern: pattern,
    })

    const reason = filenameSetting.validate()
    isValid ? expect(reason).toBeUndefined() : expect(reason).toBeDefined()
  })
})
