import PatternToken from '#enums/patternToken'
import { ValueObject } from './base'
import { TweetMediaFile } from './tweetMediaFile'
import path from 'path/posix'

export type AggregationToken = '{account}'

type FilenameSettingProps = {
  directory: string
  noSubDirectory: boolean
  filenamePattern: PatternToken[]
  fileAggregation: boolean
  groupBy: AggregationToken
}

export class FilenameSetting extends ValueObject<FilenameSettingProps> {
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