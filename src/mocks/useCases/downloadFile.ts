import type {
  DownloadFileCommand,
  DownloadFileUseCase,
} from '#domain/useCases/downloadFile'

export class MockDownloadFile implements DownloadFileUseCase {
  async process(_command: DownloadFileCommand): Promise<UnsafeTask> {
    throw new Error('Method not implemented.')
  }
}
