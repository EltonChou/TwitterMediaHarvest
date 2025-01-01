import type { Factory } from '#domain/factories/base'
import type { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'

export const toDownloadConfig: Factory<DownloadRecord, DownloadConfig> = record =>
  record.mapBy(props => props.downloadConfig)
