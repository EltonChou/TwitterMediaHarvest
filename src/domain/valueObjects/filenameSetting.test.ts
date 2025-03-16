import PatternToken from '#enums/patternToken'
import { generateTweetMediaFile } from '#utils/test/tweetMediaFile'
import { AggregationToken, FilenameSetting } from './filenameSetting'
import { faker } from '@faker-js/faker/locale/en'

describe('unit test for filename settings', () => {
  const mediaFile = generateTweetMediaFile()
  const { tweetId, serial, ext, createdAt } = mediaFile.mapBy(props => props)
  const { screenName } = mediaFile.mapBy(props =>
    props.tweetUser.mapBy(props => props)
  )
  const baseSettings = {
    directory: 'sub',
    groupBy: AggregationToken.Account,
    fileAggregation: true,
    noSubDirectory: false,
    filenamePattern: [
      PatternToken.Account,
      PatternToken.TweetId,
      PatternToken.Serial,
    ],
  }
  const year = createdAt.getFullYear()
  const month = createdAt.getMonth()
  const date = createdAt.getDate()
  const hour = createdAt.getHours()
  const minute = createdAt.getMinutes()
  const second = createdAt.getSeconds()

  const padTwo = (t: number) => String(t).padStart(2, '0')

  it.each([
    {
      settings: baseSettings,
      expectedPath: `${
        baseSettings.directory
      }/${screenName}/${screenName}-${tweetId}-${String(serial).padStart(2, '0')}${ext}`,
    },
    {
      settings: { ...baseSettings, noSubDirectory: true },
      expectedPath: `${screenName}/${screenName}-${tweetId}-${String(
        serial
      ).padStart(2, '0')}${ext}`,
    },
    {
      settings: {
        ...baseSettings,
        noSubDirectory: true,
        fileAggregation: false,
        filenamePattern: [PatternToken.UnderscoreTweetDatetime],
      },
      expectedPath: `${year}${padTwo(month + 1)}${padTwo(date)}_${padTwo(hour)}${padTwo(
        minute
      )}${padTwo(second)}${ext}`,
    },
    {
      settings: {
        ...baseSettings,
        directory: '',
      },
      expectedPath: `${screenName}/${screenName}-${tweetId}-${String(
        serial
      ).padStart(2, '0')}${ext}`,
    },
    {
      settings: {
        ...baseSettings,
        filenamePattern: [PatternToken.Account, PatternToken.TweetId],
      },
      expectedPath: `${
        baseSettings.directory
      }/${screenName}/${screenName}-${tweetId}${ext}`,
    },
  ])('can make filename', ({ settings, expectedPath }) => {
    const filenameSetting = new FilenameSetting(settings)
    const fullPath = filenameSetting.makeFilename(mediaFile)

    expect(fullPath).toBe(expectedPath)
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
      description:
        'directory should not contains reserved characters: `<>:"\\|?*`',
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
      groupBy: AggregationToken.Account,
      fileAggregation: true,
      noSubDirectory: true,
      filenamePattern: [
        PatternToken.Account,
        PatternToken.TweetId,
        PatternToken.Serial,
      ],
    })

    const reason = filenameSetting.validate()

    if (isValid) {
      expect(reason).toBeUndefined()
    } else {
      expect(reason).toBeDefined()
    }
  })

  it.each([
    {
      pattern: [
        PatternToken.Account,
        PatternToken.TweetId,
        PatternToken.Serial,
      ],
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
      groupBy: AggregationToken.Account,
      fileAggregation: true,
      noSubDirectory: true,
      filenamePattern: pattern,
    })

    const reason = filenameSetting.validate()
    if (isValid) {
      expect(reason).toBeUndefined()
    } else {
      expect(reason).toBeDefined()
    }
  })

  it('can make filename without dir', () => {
    const filenameSetting = new FilenameSetting({
      ...baseSettings,
      noSubDirectory: false,
    })

    const filename = filenameSetting.makeFilename(mediaFile, { noDir: true })

    expect(filename).toBe(
      `${screenName}-${tweetId}-${String(serial).padStart(2, '0')}${ext}`
    )
  })

  it('should handle empty filename pattern', () => {
    const filenameSetting = new FilenameSetting({
      ...baseSettings,
      filenamePattern: [],
    })

    expect(() => filenameSetting.makeFilename(mediaFile)).toThrow(
      "Filename pattern can't be empty."
    )
  })
})
