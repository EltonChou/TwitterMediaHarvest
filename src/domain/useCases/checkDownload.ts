import FilenameOverwritten from '#domain/events/FilenameOverwritten'
import type { DomainEvent } from '#domain/events/base'
import type { DownloadItem } from '#domain/repositories/download'
import type { DownloadRecord } from '#domain/valueObjects/downloadRecord'
import type { UseCase } from './base'
import path from 'node:path'

type CheckCompletedFilenameCommand = {
  item: DownloadItem
  record: DownloadRecord
}

export class CheckDownload
  implements UseCase<CheckCompletedFilenameCommand, DomainEvent[]>
{
  process(command: CheckCompletedFilenameCommand): DomainEvent[] {
    const events: DomainEvent[] = []
    // Only check base name.
    const expectedBaseName = path.parse(
      command.record.mapBy(props => props.downloadConfig).mapBy(props => props.filename)
    ).base
    const finalBaseName = path.parse(command.item.filename).base

    if (finalBaseName !== expectedBaseName) events.push(new FilenameOverwritten())

    return events
  }
}
