import PatternToken from '#enums/patternToken'
import { ValueObject } from './base'
import { TweetMediaFile } from './tweetMediaFile'
import { posix as path } from 'path'
import sanitize from 'sanitize-filename'

export type AggregationToken = '{account}'

type FilenameSettingProps = {
  directory: string
  noSubDirectory: boolean
  filenamePattern: PatternToken[]
  fileAggregation: boolean
  groupBy: AggregationToken
}

const PATH_MAX = 4096

export const enum InvalidReason {
  PathTooLong = `Maximum path is ${PATH_MAX} characters.`,
  // eslint-disable-next-line max-len
  ContainsReservedCharacters = 'Directory path contains reserved characters. (`\\`, `?`, `<`, `>`, `,`, `:`, `*`, `|`, and `"`)',
  ContainsIllegalCharacters = 'Contains illegal characters.',
  PatternMayNotBeUnique = 'The pattern should contains at least {hash} or {tweetId} and {serial}',
}

const dirPattern = /^[^<>:"/\\|?*][^<>:"\\|?*]+$/

export class FilenameSetting extends ValueObject<FilenameSettingProps> {
  validate(): InvalidReason | undefined {
    if (this.props.directory.length > PATH_MAX) return InvalidReason.PathTooLong

    if (!dirPattern.test(this.props.directory))
      return InvalidReason.ContainsReservedCharacters

    if (!this.props.directory.split('/').every(dir => sanitize(dir) === dir))
      return InvalidReason.ContainsIllegalCharacters

    if (
      !(
        this.props.filenamePattern.includes(PatternToken.Hash) ||
        (this.props.filenamePattern.includes(PatternToken.TweetId) &&
          this.props.filenamePattern.includes(PatternToken.Serial))
      )
    )
      return InvalidReason.PatternMayNotBeUnique

    return undefined
  }

  makeFilename(mediaFile: TweetMediaFile): string {
    const { screenName, id, createdAt, userId, hash, serial } = mediaFile.mapBy(
      props => ({
        id: props.tweetId,
        createdAt: props.createdAt,
        hash: props.hash,
        serial: props.serial,
        ...props.tweetUser.mapBy(props => ({
          screenName: props.screenName,
          userId: props.userId,
        })),
      })
    )
    const currentDate = new Date()

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

    return path.format({
      dir: this.makeAggregationDirectory(mediaFile),
      name: filename,
      ext: mediaFile.mapBy(props => props.ext),
    })
  }

  makeAggregationDirectory(mediaFile: TweetMediaFile): string {
    const baseDir = this.props.noSubDirectory ? '' : this.props.directory

    if (!this.props.fileAggregation) return baseDir

    switch (this.props.groupBy) {
      case '{account}':
        return path.join(
          baseDir,
          mediaFile.mapBy(props => props.tweetUser.mapBy(props => props.screenName))
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
