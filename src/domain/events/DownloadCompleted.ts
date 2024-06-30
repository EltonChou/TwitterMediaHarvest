import DownloadBaseEvent from './Download'

export default class DownloadCompleted extends DownloadBaseEvent {
  constructor(downloadId: number) {
    super('download:status:completed', downloadId)
  }
}
