/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import LockCriteria from './enums'
import { LockContext } from './types'

export const runWithWebLock =
  <T = unknown>(
    criteria: LockCriteria,
    options?: LockOptions
  ): LockContext<T> =>
  task =>
    options
      ? navigator.locks.request(criteria, options, task)
      : navigator.locks.request(criteria, task)
