import PatternToken from '#enums/patternToken'
import type { V4FilenameSettings } from '#schema'
import type { ISettingsRepository } from '../repositories/settings'
import { AsyncUseCase } from './base'
import path from 'path/posix'

export type FileInfo = {
  serial: number
  hash: string
  date: Date
  ext: `.${string}`
}

type MakeMediaFileFullPathCommand = {
  tweetDetail: TweetDetail
  fileInfo: FileInfo
}

export class MakeMediaFileFullPath
  implements AsyncUseCase<MakeMediaFileFullPathCommand, string>
{
  constructor(readonly filenameSettingsRepo: ISettingsRepository<V4FilenameSettings>) {}

  async process({
    tweetDetail,
    fileInfo,
  }: MakeMediaFileFullPathCommand): Promise<string> {
    const settings = await this.filenameSettingsRepo.get()
    return path.format({
      dir: makeAggregationDirectory(settings)(tweetDetail),
      name: makeFilename(settings)(tweetDetail, fileInfo),
      ext: fileInfo.ext,
    })
  }
}

export const makeFilename =
  (settings: V4FilenameSettings) =>
  (tweetDetail: TweetDetail, { serial, hash, date }: FileInfo): string => {
    const filename = settings.filenamePattern
      .join('-')
      .replace(PatternToken.Account, tweetDetail.screenName)
      .replace(PatternToken.TweetId, tweetDetail.id)
      .replace(PatternToken.Serial, String(serial).padStart(2, '0'))
      .replace(PatternToken.Hash, hash)
      .replace(PatternToken.Date, makeDateString(date))
      .replace(PatternToken.Datetime, makeDatetimeString(date))
      .replace(PatternToken.TweetDate, makeDateString(tweetDetail.createdAt))
      .replace(PatternToken.TweetDatetime, makeDatetimeString(tweetDetail.createdAt))
      .replace(PatternToken.AccountId, tweetDetail.userId)

    return filename
  }

const makeAggregationDirectory =
  (settings: V4FilenameSettings) =>
  (tweetDetail: TweetDetail): string => {
    const baseDir = settings.noSubDirectory ? '' : settings.directory

    if (!settings.fileAggregation) return baseDir

    switch (settings.groupBy) {
      case '{account}':
        return path.join(baseDir, tweetDetail.screenName)

      default:
        return path.join(baseDir, tweetDetail.screenName)
    }
  }

/**
 * @description For {@link PatternToken.TweetDatetime} token, `YYYYMMDDHHMMSS`
 */
export const makeDatetimeString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0') +
  String(date.getHours()).padStart(2, '0') +
  String(date.getMinutes()).padStart(2, '0') +
  String(date.getSeconds()).padStart(2, '0')

/**
 * @description For {@link PatternToken.TweetDate} token, `YYYYMMDD`
 */
export const makeDateString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0')

/**
 * @description For {@link PatternToken.TweetDate} token, `YYYYMMDD_HHMMSS`
 */
export const makeUnderscoreDatetimeString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0') +
  '_' +
  String(date.getHours()).padStart(2, '0') +
  String(date.getMinutes()).padStart(2, '0') +
  String(date.getSeconds()).padStart(2, '0')
