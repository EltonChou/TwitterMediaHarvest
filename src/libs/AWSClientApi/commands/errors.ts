import { MetadataBearer } from './types'

export class CommandResponseError extends Error {
  name = 'CommandResopnseError'

  constructor(message: string, metaData: MetadataBearer) {
    super(message + '\n' + JSON.stringify(metaData))
  }
}
