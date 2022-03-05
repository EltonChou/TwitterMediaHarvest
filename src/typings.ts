export enum FilenameSerialRule {
  Order = 'order',
  Filename = 'filename'
}

export enum DownloadMode {
  Aria2 = 'aria2',
  Browser = 'browser',
}

export enum StatisticsKey {
  SuccessDownloadCount = 'successDownloadCount',
  FailedDownloadCount = 'failedDownloadCount',
  ErrorCount = 'errorCount',
}

export enum Action {
  Download,
  Refresh
}
