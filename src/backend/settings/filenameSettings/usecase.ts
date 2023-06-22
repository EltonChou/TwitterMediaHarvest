import type { V4FilenameSettings } from '@schema'
import path from 'path'

export type FileInfo = {
  account: string
  tweetId: string
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
}

export default class V4FilenameSettingsUsecase {
  constructor(readonly settings: V4FilenameSettings) {}

  makeFilename({ account, tweetId, serial, hash, date }: FileInfo): string {
    const dateString =
      String(date.getFullYear()) + String(date.getMonth()).padStart(2, '0') + String(date.getDate()).padStart(2, '0')

    const filename = this.settings.filenamePattern
      .join('-')
      .replace(PatternToken.Account, account)
      .replace(PatternToken.TweetId, tweetId)
      .replace(PatternToken.Serial, String(serial).padStart(2, '0'))
      .replace(PatternToken.Hash, hash)
      .replace(PatternToken.Date, dateString)

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
