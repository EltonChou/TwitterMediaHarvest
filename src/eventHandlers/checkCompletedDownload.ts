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
    if (!downloadItem || !wasTriggeredBySelf.process({ item: downloadItem })) return

    const { value: downloadRecord, error } = await downloadRecordRepo.getById(
      event.downloadId
    )
    if (error) return

    const expectedBaseName = path.parse(
      downloadRecord.mapBy(props => props.downloadConfig).mapBy(props => props.filename)
    ).base
    const finalBaseName = path.parse(downloadItem.filename).base

    if (finalBaseName !== expectedBaseName)
      eventPublisher.publish(new FilenameOverwritten())
  }
