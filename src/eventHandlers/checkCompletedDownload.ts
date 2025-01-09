import type { DomainEventHandler } from '#domain/eventPublisher'
import FilenameIsOverwritten from '#domain/events/FilenameIsOverwritten'
import type { Factory } from '#domain/factories/base'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { toFilename } from '../mappers/downloadConfig'
import { toDownloadConfig } from '../mappers/downloadRecord'
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
      filenameToBaseName
    )
    const finalBaseName = pipe(downloadItem.filename, filenameToBaseName)

    if (finalBaseName !== expectedBaseName)
      await eventPublisher.publish(
        new FilenameIsOverwritten(expectedBaseName, finalBaseName)
      )
  }

const filenameToBaseName: Factory<string, string> = filename =>
  path.parse(filename).base
