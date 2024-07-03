import FilenameOverwritten from '#domain/events/FilenameOverwritten'
import { DomainEvent } from '#domain/events/base'
import { IDownloadRepository } from '#domain/repositories/download'
import { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { AsyncUseCase } from './base'
import path from 'node:path'

type CheckCompletedFilenameCommand = {
  downloadId: number
}

export class CheckDownload
  implements AsyncUseCase<CheckCompletedFilenameCommand, void>, DomainEventSource
{
  readonly downloadRepo: IDownloadRepository
  readonly recordRepo: IDownloadRecordRepository
  private _events: DomainEvent[]

  constructor(downloadRepo: IDownloadRepository, recordRepo: IDownloadRecordRepository) {
    this.downloadRepo = downloadRepo
    this.recordRepo = recordRepo
    this._events = []
  }

  get events() {
    return this._events
  }

  async process(command: CheckCompletedFilenameCommand): Promise<void> {
    const downloadItem = await this.downloadRepo.getById(command.downloadId)
    if (!downloadItem) return

    const downloadRecord = await this.recordRepo.getById(command.downloadId)
    if (!downloadRecord) return

    // Only check base name.
    const expectedBaseName = path.parse(
      downloadRecord.mapBy(props => props.downloadConfig).mapBy(props => props.filename)
    ).base
    const finalBaseName = path.parse(downloadItem.filename).base

    if (finalBaseName !== expectedBaseName) this._events.push(new FilenameOverwritten())
  }
}
