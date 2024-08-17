import type ConflictAction from '#enums/ConflictAction'
import { ValueObject } from './base'

type DownloadConfigProps = {
  url: string
  filename: string
  saveAs: boolean
  conflictAction: ConflictAction
}

export class DownloadConfig extends ValueObject<DownloadConfigProps> {}
