import type { DownloadRecordId } from '@schema'

const downloadRecordIdPattern = /^dl_(\d+)/

export class DownloadRecordIdHelper {
  static toDownloadItemId(downloadRecordId: DownloadRecordId): number {
    return Number(downloadRecordId.match(downloadRecordIdPattern)[1])
  }

  static validId(downloadRecordId: string): boolean {
    return Boolean(downloadRecordId.match(downloadRecordIdPattern))
  }
}
