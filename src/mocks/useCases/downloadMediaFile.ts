import type {
  DownloadMediaFileCommand,
  DownloadMediaFileUseCase,
} from '#domain/useCases/downloadMediaFile'

export class MockDownloadMediaFile implements DownloadMediaFileUseCase {
  isOk = true
  events: IDomainEvent[] = []

  process(command: DownloadMediaFileCommand): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
