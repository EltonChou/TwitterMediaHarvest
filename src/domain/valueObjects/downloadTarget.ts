import { ValueObject } from './base'

type DownloadTargetProps = {
  url: string
  filename: string
}

export class DownloadTarget extends ValueObject<DownloadTargetProps> {}
