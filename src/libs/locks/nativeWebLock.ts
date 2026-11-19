/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import LockCriteria from './enums'
import type { WebLockHandle } from './types'

/**
 * Acquire a web lock held until disposed.
 * Use with `await using` or {@link AsyncDisposableStack#use}.
 */
export const acquireWebLock = async (
  criteria: LockCriteria,
  options: LockOptions = {}
): Promise<WebLockHandle> => {
  const acquired = Promise.withResolvers<Lock | null>()
  const released = Promise.withResolvers<void>()

  const settled = navigator.locks.request(criteria, options, lock => {
    acquired.resolve(lock)
    return released.promise
  })
  // Request can reject before the callback runs (e.g. aborted signal).
  settled.catch(acquired.reject)

  const lock = await acquired.promise

  return {
    lock,
    [Symbol.asyncDispose]: async () => {
      released.resolve()
      await settled
    },
  }
}
