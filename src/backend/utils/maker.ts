import { DownloadRecordId } from '../../typings'


export const makeDownloadRecordId = (downloadId: number): DownloadRecordId =>
  `dl_${downloadId}`
