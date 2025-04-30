/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ValueObject } from './base'

type TwitterTokenProps = {
  name: string
  value: string
}

export class TwitterToken extends ValueObject<TwitterTokenProps> {
  get value() {
    return this.props.value
  }
}
