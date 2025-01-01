import { DomainEvent } from './base'

export default class FilenameIsOverwritten
  extends DomainEvent
  implements FilenameOverwrittenEvent
{
  readonly expectedName: string
  readonly finalName: string

  constructor(expectedName: string, finalName: string) {
    super('filename:overwritten')
    this.expectedName = expectedName
    this.finalName = finalName
  }
}
