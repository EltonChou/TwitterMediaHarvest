import { TimeHelper } from '#helpers/time'
import { ValueObject } from './base'

type AWSCredentialProps = {
  identityId: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  expiration?: Date
}

const EXPIRE_REDUNDANCY = TimeHelper.minute(3)

export class AWSCredential extends ValueObject<AWSCredentialProps> {
  get isExpired() {
    return this.props.expiration
      ? this.props.expiration.getTime() - EXPIRE_REDUNDANCY < Date.now()
      : false
  }
}
