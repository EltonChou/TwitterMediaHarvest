import type { Factory } from '#domain/factories/base'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'

export const toFilename: Factory<DownloadConfig, string> = config =>
  config.mapBy(props => props.filename)
