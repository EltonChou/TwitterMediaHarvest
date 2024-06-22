import { ValueObject } from './base'

type DownloadConfigProps = {
  url: string
  filename: string
  saveAs: boolean
  conflictAction: 'overwrite'
}

export class DownloadConfig extends ValueObject<DownloadConfigProps> {}
