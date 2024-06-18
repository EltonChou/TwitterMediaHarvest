import { PatternToken } from '@backend/enums'
import type { V4FilenameSettings } from '@schema'
import path from 'path'

export type FileInfo = {
  serial: number
  hash: string
  date: Date
}

// YYYYMMDDHHMMSS
const makeDatetimeString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0') +
  String(date.getHours()).padStart(2, '0') +
  String(date.getMinutes()).padStart(2, '0') +
  String(date.getSeconds()).padStart(2, '0')

// YYYYMMDD
const makeDateString = (date: Date): string =>
  String(date.getFullYear()) +
  String(date.getMonth() + 1).padStart(2, '0') +
  String(date.getDate()).padStart(2, '0')

export default class V4FilenameSettingsUsecase {
  constructor(readonly settings: V4FilenameSettings) {}

  makeFilename(tweetDetail: TweetDetail, { serial, hash, date }: FileInfo): string {
    const filename = this.settings.filenamePattern
      .join(this.settings.separator)
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

  makeAggregationDirectory(tweetDetail: TweetDetail): string {
    switch (this.settings.groupBy) {
      case '{account}':
        return tweetDetail.screenName

      default:
        return tweetDetail.screenName
    }
  }

  makeFullPathWithFilenameAndExt(
    filename: string,
    ext: string,
    aggregationDir?: string
  ): string {
    let dir = this.settings.noSubDirectory ? '' : this.settings.directory
    if (this.settings.fileAggregation && aggregationDir) {
      dir = dir + '/' + aggregationDir
    }
    return path.format({
      dir: dir,
      name: filename,
      ext: ext,
    })
  }
}
