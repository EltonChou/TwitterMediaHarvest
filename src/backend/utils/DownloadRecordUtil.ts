const downloadRecordIdPattern = /^dl_(\d+)/

export default class DownloadRecordUtil {
  static isValidId(downloadRecordId: string): boolean {
    return Boolean(downloadRecordId.match(downloadRecordIdPattern))
  }

  static extractDownloadItemId(downloadRecordId: string): number {
    return Number(downloadRecordId.match(downloadRecordIdPattern)[1])
  }

  static createId(downloadItemId: number): DownloadRecordId {
    return `dl_${downloadItemId}`
  }
}
