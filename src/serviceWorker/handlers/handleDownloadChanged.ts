import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadCompleted from '#domain/events/DownloadCompleted'
import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import {
  isDownloadCompleted,
  isDownloadInterrupted,
} from '#utils/downloadState'
import type { Downloads } from 'webextension-polyfill'

export const handleDownloadChanged =
  (
    downloadRepo: IDownloadRepository,
    checkDownloadIsOwnBySelf: CheckDownloadWasTriggeredBySelf,
    publisher: DomainEventPublisher
  ): ListenerOf<Downloads.Static['onChanged']> =>
  async downloadDelta => {
    // Only focus on state.
    const { state: downloadStateDelta } = downloadDelta
    if (!downloadStateDelta) return

    const downloadItem = await downloadRepo.getById(downloadDelta.id)
    if (
      !downloadItem ||
      !checkDownloadIsOwnBySelf.process({ item: downloadItem })
    )
      return

    if (isDownloadCompleted(downloadStateDelta)) {
      await publisher.publish(new DownloadCompleted(downloadDelta.id))
      return
    }

    if (isDownloadInterrupted(downloadStateDelta)) {
      await publisher.publish(
        new DownloadInterrupted(
          downloadDelta.id,
          downloadDelta.error?.current ?? 'unknown'
        )
      )
      return
    }
  }

export default handleDownloadChanged
