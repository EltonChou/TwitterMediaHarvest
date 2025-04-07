/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DomainEventHandler } from '#domain/eventPublisher'
import FilenameIsOverwritten from '#domain/events/FilenameIsOverwritten'
import type { Factory } from '#domain/factories/base'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { IDownloadRecordRepository } from '#domain/repositories/downloadRecord'
import { toFilename } from '../mappers/downloadConfig'
import { toDownloadConfig } from '../mappers/downloadRecord'
import { pipe } from 'fp-ts/lib/function'

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

const baseNamePattern = /[^\\/]+$/
const filenameToBaseName: Factory<string, string> = filename => {
  const matched = filename.match(baseNamePattern)
  if (matched) return matched.at(0) ?? ''
  return ''
}
