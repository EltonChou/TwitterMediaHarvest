/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { TimeHelper } from '#helpers/time'
import { ValueObject } from './base'

type ClientInfoProps = {
  uuid: string
  syncToken: string
  uninstallCode: string
  syncedAt: number
}

const SYNC_PERIOD: number =
  process.env.NODE_ENV === 'production'
    ? TimeHelper.minute(30)
    : TimeHelper.minute(10)

/**
 * syncing period is 30 minutes in prodcution, otherwise 10 minutes.
 */
export class ClientInfo extends ValueObject<ClientInfoProps> {
  get uuid() {
    return this.props.uuid
  }

  get syncToken() {
    return this.props.syncToken
  }

  get uninstallCode() {
    return this.props.uninstallCode
  }

  get shouldSync(): boolean {
    return Date.now() - this.props.syncedAt >= SYNC_PERIOD
  }
}
