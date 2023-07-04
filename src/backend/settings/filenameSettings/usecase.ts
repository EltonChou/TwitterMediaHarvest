import type { V4FilenameSettings } from '@schema'
import path from 'path'

export type FileInfo = {
  serial: number
  hash: string
  date: Date
}

enum PatternToken {
  Account = '{account}',
  TweetId = '{tweetId}',
  Serial = '{serial}',
  Hash = '{hash}',
  Date = '{date}',
  Datetime = '{datetime}',
  Timestamp = '{timestamp}',
  TweetDate = '{tweetDate}',
  TweetDatetime = '{tweetDatetime}',
  TweetTimestamp = '{tweetTimestamp}',
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
  String(date.getFullYear()) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0')

export default class V4FilenameSettingsUsecase {
  constructor(readonly settings: V4FilenameSettings) {}

  makeFilename(tweetDetail: TweetDetail, { serial, hash, date }: FileInfo): string {
    const filename = this.settings.filenamePattern
      .join('-')
      .replace(PatternToken.Account, tweetDetail.screenName)
      .replace(PatternToken.TweetId, tweetDetail.id)
      .replace(PatternToken.Serial, String(serial).padStart(2, '0'))
      .replace(PatternToken.Hash, hash)
      .replace(PatternToken.Date, makeDateString(date))
      .replace(PatternToken.Datetime, makeDatetimeString(date))
      .replace(PatternToken.TweetDate, makeDateString(tweetDetail.createdAt))
      .replace(PatternToken.TweetDatetime, makeDatetimeString(tweetDetail.createdAt))

    return filename
  }

  makeFullPathWithFilenameAndExt(filename: string, ext: string): string {
    return path.format({
      dir: this.settings.noSubDirectory ? '' : this.settings.directory,
      name: filename,
      ext: ext,
    })
  }
}
