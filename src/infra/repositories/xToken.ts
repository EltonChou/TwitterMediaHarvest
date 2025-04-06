/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import Browser from 'webextension-polyfill'

export class XTokenRepo implements ITwitterTokenRepository {
  async getByName(name: string): Promise<TwitterToken | undefined> {
    const cookie = await Browser.cookies.get({
      url: 'https://x.com',
      name: name,
    })

    return cookie
      ? new TwitterToken({ name: cookie.name, value: cookie.value })
      : undefined
  }

  async getCsrfToken(): Promise<TwitterToken | undefined> {
    return this.getByName('ct0')
  }

  async getGuestToken(): Promise<TwitterToken | undefined> {
    return this.getByName('gt')
  }
}
