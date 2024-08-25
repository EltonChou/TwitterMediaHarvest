import type { DomainEventPublisher } from '#domain/eventPublisher'
import DownloadCompleted from '#domain/events/DownloadCompleted'
import DownloadInterrupted from '#domain/events/DownloadInterrupted'
import type { IDownloadRepository } from '#domain/repositories/download'
import type { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { isDownloadCompleted, isDownloadInterrupted } from '#utils/downloadState'
import type { Downloads } from 'webextension-polyfill'

export const handleDownloadChanged =
  (
    downloadRepo: IDownloadRepository,
    checkDownloadIsOwnBySelf: CheckDownloadWasTriggeredBySelf,
    publisher: DomainEventPublisher
  ) =>
  async (downloadDelta: Downloads.OnChangedDownloadDeltaType) => {
    // Only focus on state.
    if ('state' in downloadDelta) {
      const downloadItem = await downloadRepo.getById(downloadDelta.id)
      if (!downloadItem || !checkDownloadIsOwnBySelf.process({ item: downloadItem }))
        return

      if (isDownloadCompleted(downloadDelta.state as Downloads.StringDelta))
        await publisher.publish(new DownloadCompleted(downloadDelta.id))

      if (isDownloadInterrupted(downloadDelta.state as Downloads.StringDelta))
        await publisher.publish(
          new DownloadInterrupted(
            downloadDelta.id,
            downloadDelta.error?.current ?? 'unknown'
          )
        )
    }
  }

export default handleDownloadChanged
