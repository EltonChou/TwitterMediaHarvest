/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
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
      : true
  }
}
