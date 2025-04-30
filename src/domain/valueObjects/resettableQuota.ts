/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

interface ResettableQuotaProps extends LiteralObject {
  quota: number
  resetAt: Date
}

export class ResettableQuota extends ValueObject<ResettableQuotaProps> {
  get remaining(): number {
    return this.props.quota
  }

  get resetTime(): Date {
    return this.props.resetAt
  }

  get isReset(): boolean {
    return new Date(Date.now()) >= this.props.resetAt
  }
}
