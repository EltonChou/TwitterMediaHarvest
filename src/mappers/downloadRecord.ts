import type { Factory } from '#domain/factories/base'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export const toDownloadConfig: Factory<
  DownloadRecord,
  DownloadConfig
> = record => record.mapBy(props => props.downloadConfig)
