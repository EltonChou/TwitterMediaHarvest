import { ValueObject } from './base'

type DownloadConfigProps = {
  url: string
  filename: string
  saveAs: boolean
  conflictAction: 'uniquify' | 'overwrite' | 'prompt'
}

export class DownloadConfig extends ValueObject<DownloadConfigProps> {}
