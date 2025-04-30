/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TwitterToken } from '../valueObjects/twitterToken'

export interface ITwitterTokenRepository {
  getByName(name: string): Promise<TwitterToken | undefined>
  getCsrfToken(): Promise<TwitterToken | undefined>
  getGuestToken(): Promise<TwitterToken | undefined>
}
