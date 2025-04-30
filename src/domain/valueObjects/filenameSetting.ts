/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import PatternToken from '#enums/patternToken'
import { propsExtractor } from '#utils/valuObject'
import { ValueObject } from './base'
import { TweetMediaFile } from './tweetMediaFile'
import { posix as path } from 'path'
import sanitize from 'sanitize-filename'

export const enum AggregationToken {
  Account = '{account}',
}

type FilenameSettingProps = {
  directory: string
  noSubDirectory: boolean
  filenamePattern: PatternToken[]
  fileAggregation: boolean
  groupBy: AggregationToken
}

type MakeFilenameOptions = {
  noDir?: boolean
}

const PATH_MAX = 4096

export const enum InvalidReason {
  PathTooLong = 'Maximum path is 4096 characters.',
  ContainsReservedCharacters = 'Directory path contains reserved characters. (`\\`, `?`, `<`, `>`, `,`, `:`, `*`, `|`, and `"`)',
  ContainsIllegalCharacters = 'Contains illegal characters.',
  PatternMayNotBeUnique = 'The pattern should contains at least {hash} or {tweetId} and {serial}',
}

const dirPattern = /^[^<>:"/\\|?*][^<>:"\\|?*]+$/

export class FilenameSetting extends ValueObject<FilenameSettingProps> {
  static validateDirectory(directory: string): InvalidReason | undefined {
    if (directory.length > PATH_MAX) return InvalidReason.PathTooLong

    if (!dirPattern.test(directory))
      return InvalidReason.ContainsReservedCharacters

    if (!directory.split('/').every(dir => sanitize(dir) === dir))
      return InvalidReason.ContainsIllegalCharacters

    return undefined
  }

  static validateFilenamePattern(
    filenamePattern: PatternToken[]
  ): InvalidReason | undefined {
    if (
      filenamePattern.includes(PatternToken.Hash) ||
      (filenamePattern.includes(PatternToken.TweetId) &&
        filenamePattern.includes(PatternToken.Serial))
    )
      return undefined
    return InvalidReason.PatternMayNotBeUnique
  }

  validate(): InvalidReason | undefined {
    const invalidDirectoryReason = FilenameSetting.validateDirectory(
      this.props.directory
    )
    if (invalidDirectoryReason) return invalidDirectoryReason

    const invalidPatternReason = FilenameSetting.validateFilenamePattern(
      this.props.filenamePattern
    )
    if (invalidPatternReason) return invalidPatternReason

    return undefined
  }

  makeFilename(
    mediaFile: TweetMediaFile,
    options?: MakeFilenameOptions
  ): string {
    const { screenName, id, createdAt, userId, hash, serial } = mediaFile.mapBy(
      props => ({
        id: props.tweetId,
        createdAt: props.createdAt,
        hash: props.hash,
        serial: props.serial,
        ...props.tweetUser.mapBy(propsExtractor('screenName', 'userId')),
      })
    )
    const currentDate = new Date()

    if (this.props.filenamePattern.length === 0)
      throw new Error("Filename pattern can't be empty.")

    const filename = this.props.filenamePattern
      .join('-')
      .replace(PatternToken.Account, screenName)
      .replace(PatternToken.TweetId, id)
      .replace(PatternToken.Serial, String(serial).padStart(2, '0'))
      .replace(PatternToken.Hash, hash)
      .replace(PatternToken.Date, makeDateString(currentDate))
      .replace(PatternToken.Datetime, makeDatetimeString(currentDate))
      .replace(PatternToken.TweetDate, makeDateString(createdAt))
      .replace(PatternToken.TweetDatetime, makeDatetimeString(createdAt))
      .replace(PatternToken.AccountId, userId)
      .replace(
        PatternToken.UnderscoreDateTime,
        makeUnderscoreDatetimeString(currentDate)
      )
      .replace(
        PatternToken.UnderscoreTweetDatetime,
        makeUnderscoreDatetimeString(createdAt)
      )
      .replace(PatternToken.TweetTimestamp, createdAt.getTime().toString())
      .replace(PatternToken.Timestamp, currentDate.getTime().toString())

    return path.format({
      dir: options?.noDir
        ? undefined
        : this.makeAggregationDirectory(mediaFile),
      name: filename,
      ext: mediaFile.mapBy(props => props.ext),
    })
  }

  makeAggregationDirectory(mediaFile: TweetMediaFile): string {
    const baseDir = this.props.noSubDirectory ? '' : this.props.directory

    if (!this.props.fileAggregation) return baseDir

    switch (this.props.groupBy) {
      case AggregationToken.Account:
        return path.join(
          baseDir,
          mediaFile.mapBy(props =>
            props.tweetUser.mapBy(props => props.screenName)
          )
        )

      // It shouldn't happen unless someone modified the settings manually.
      /* istanbul ignore next */
      default:
        throw new Error('Invalid `groupBy` settings: ' + this.props.groupBy)
    }
  }
}

/**
 * @description For {@link PatternToken.TweetDatetime} token, `YYYYMMDDHHMMSS`
 */
const makeDatetimeString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0') +
  String(date.getHours()).padStart(2, '0') +
  String(date.getMinutes()).padStart(2, '0') +
  String(date.getSeconds()).padStart(2, '0')

/**
 * @description For {@link PatternToken.TweetDate} token, `YYYYMMDD`
 */
const makeDateString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0')

/**
 * @description For {@link PatternToken.TweetDate} token, `YYYYMMDD_HHMMSS`
 */
const makeUnderscoreDatetimeString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0') +
  '_' +
  String(date.getHours()).padStart(2, '0') +
  String(date.getMinutes()).padStart(2, '0') +
  String(date.getSeconds()).padStart(2, '0')
