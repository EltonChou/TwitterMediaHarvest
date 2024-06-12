import type { ISettingsRepository } from '../repositories/settings'
import { PatternToken } from '@backend/enums'
import type { V4FilenameSettings } from '@schema'
import path from 'path/posix'

export type FileInfo = {
  serial: number
  hash: string
  date: Date
  ext: `.${string}`
}

export interface IMediaFilenameUseCase {
  makeFilename(
    tweetDetail: TweetDetail,
    { serial, hash, date }: FileInfo
  ): Promise<string>
  makeAggregationDirectory(tweetDetail: TweetDetail): Promise<string>
  makeFileFullPath(tweetDetail: TweetDetail, fileInfo: FileInfo): Promise<string>
}

export class MediaFilenameUseCase implements IMediaFilenameUseCase {
  private settings: V4FilenameSettings | undefined

  constructor(readonly filenameSettingsRepo: ISettingsRepository<V4FilenameSettings>) {}

  private async getFilenameSettings(): Promise<V4FilenameSettings> {
    if (!this.settings) {
      this.settings = await this.filenameSettingsRepo.get()
    }
    return this.settings
  }

  async makeFilename(
    tweetDetail: TweetDetail,
    { serial, hash, date }: FileInfo
  ): Promise<string> {
    const settings = await this.filenameSettingsRepo.get()

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

  async makeAggregationDirectory(tweetDetail: TweetDetail): Promise<string> {
    const settings = await this.getFilenameSettings()
    const baseDir = settings.noSubDirectory ? '' : settings.directory

    if (!settings.fileAggregation) return baseDir

    switch (settings.groupBy) {
      case '{account}':
        return path.join(baseDir, tweetDetail.screenName)

      default:
        return path.join(baseDir, tweetDetail.screenName)
    }
  }

  async makeFileFullPath(tweetDetail: TweetDetail, fileInfo: FileInfo): Promise<string> {
    return path.format({
      dir: await this.makeAggregationDirectory(tweetDetail),
      name: await this.makeFilename(tweetDetail, fileInfo),
      ext: fileInfo.ext,
    })
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
