import type { DomainEventHandler } from '#domain/eventPublisher'
import FilenameOverwritten from '#domain/events/FilenameOverwritten'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import type { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import path from 'node:path'

export const checkCompletedDownload =
  (
    downloadRepo: IDownloadRepository,
    downloadRecordRepo: IDownloadRecordRepository,
    wasTriggeredBySelf: CheckDownloadWasTriggeredBySelf
  ): DomainEventHandler<DomainEventMap['download:status:completed']> =>
  async (event, eventPublisher) => {
    const downloadItem = await downloadRepo.getById(event.downloadId)
    if (!wasTriggeredBySelf.process({ item: downloadItem })) return

    const downloadRecord = await downloadRecordRepo.getById(event.downloadId)
    if (!downloadRecord) return

    const expectedBaseName = path.parse(
      downloadRecord.mapBy(props => props.downloadConfig).mapBy(props => props.filename)
    ).base
    const finalBaseName = path.parse(downloadItem.filename).base

    if (finalBaseName !== expectedBaseName)
      eventPublisher.publish(new FilenameOverwritten())
  }
