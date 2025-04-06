/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { CommandCache } from '../commands/types'

export class MockCommandCache implements CommandCache {
  private readonly cache: Map<string, Response> = new Map()

  async get(request: Request): Promise<Response | undefined> {
    return this.cache.get(request.url)
  }

  async put(request: Request, response: Response): Promise<void> {
    this.cache.set(request.url, response)
  }
}
