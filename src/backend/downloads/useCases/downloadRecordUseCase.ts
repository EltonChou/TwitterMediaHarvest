import { downloadItemRecorder } from '../downloadItemRecorder'
import { DownloadRecord } from '../models'
import type { IDownloadRecordsRepository } from '../repositories'
import { sleep } from '@libs/helpers'
import Browser from 'webextension-polyfill'

export default class DownloadRecordUseCase {
  constructor(readonly recordRepo: IDownloadRecordsRepository) {}

  private async download({ tweetInfo, downloadConfig, id }: DownloadRecord) {
    const downloadRecorder = downloadItemRecorder(this.recordRepo)(tweetInfo)(
      downloadConfig
    )
    await this.recordRepo.removeById(id)
    const newDownloadId = await Browser.downloads.download(downloadConfig)
    downloadRecorder(newDownloadId)
  }

  async retryByDownloadId(downloadId: number) {
    const record = await this.recordRepo.getById(downloadId)
    if (!record) return
    await this.download(record)
  }

  async retryAll() {
    const records = await this.recordRepo.getAll()
    for (const record of records) {
      await this.download(record)
      await sleep(300)
    }
  }
}
