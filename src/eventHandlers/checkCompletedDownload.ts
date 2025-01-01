import type { DomainEventHandler } from '#domain/eventPublisher'
import FilenameIsOverwritten from '#domain/events/FilenameIsOverwritten'
import type { Factory } from '#domain/factories/base'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import { pipe } from 'fp-ts/lib/function'
import { posix as path } from 'path'

export const checkCompletedDownload =
  (
    downloadRepo: IDownloadRepository,
    downloadRecordRepo: IDownloadRecordRepository
  ): DomainEventHandler<DomainEventMap['download:status:completed']> =>
  async (event, eventPublisher) => {
    const downloadItem = await downloadRepo.getById(event.downloadId)
    if (!downloadItem) return

    const { value: downloadRecord, error } = await downloadRecordRepo.getById(
      event.downloadId
    )
    if (error) return

    const expectedBaseName = pipe(
      downloadRecord,
      toDownloadConfig,
      toFilename,
      filenameToBasename
    )
    const finalBaseName = pipe(downloadItem.filename, filenameToBasename)

    if (finalBaseName !== expectedBaseName)
      await eventPublisher.publish(
        new FilenameIsOverwritten(expectedBaseName, finalBaseName)
      )
  }

const toDownloadConfig: Factory<DownloadRecord, DownloadConfig> = record =>
  record.mapBy(props => props.downloadConfig)

const toFilename: Factory<DownloadConfig, string> = config =>
  config.mapBy(props => props.filename)

const filenameToBasename: Factory<string, string> = filename => path.parse(filename).base
