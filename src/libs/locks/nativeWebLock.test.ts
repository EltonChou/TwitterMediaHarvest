/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import LockCriteria from './enums'
import { acquireWebLock } from './nativeWebLock'

type Callback = (lock: Lock | null) => Promise<unknown>

const mockLocks = (
  impl: (name: string, options: LockOptions, cb: Callback) => Promise<unknown>
) => {
  const request = jest.fn(impl)
  Object.defineProperty(navigator, 'locks', {
    value: { request },
    configurable: true,
  })
  return request
}

describe('acquireWebLock', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'locks')

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'locks', original)
    else delete (navigator as { locks?: LockManager }).locks
  })

  it('holds the lock until disposed', async () => {
    let held = false
    mockLocks(async (name, _, cb) => {
      held = true
      await cb({ name, mode: 'exclusive' } as Lock)
      held = false
    })

    {
      await using handle = await acquireWebLock(LockCriteria.ClientSync)
      expect(handle.lock?.name).toBe(LockCriteria.ClientSync)
      expect(held).toBeTrue()
    }

    expect(held).toBeFalse()
  })

  it('passes options through to navigator.locks.request', async () => {
    const request = mockLocks((_, __, cb) => cb(null))
    const options: LockOptions = { ifAvailable: true }

    await using handle = await acquireWebLock(LockCriteria.ClientSync, options)

    expect(request).toHaveBeenCalledWith(
      LockCriteria.ClientSync,
      options,
      expect.any(Function)
    )
    expect(handle.lock).toBeNull()
  })

  it('rejects when the request fails before acquiring', async () => {
    const error = new DOMException('aborted', 'AbortError')
    mockLocks(() => Promise.reject(error))

    await expect(acquireWebLock(LockCriteria.ClientSync)).rejects.toBe(error)
  })

  it('releases the lock when the scope throws', async () => {
    let held = false
    mockLocks(async (name, _, cb) => {
      held = true
      await cb({ name, mode: 'exclusive' } as Lock)
      held = false
    })
    const error = new Error('boom')

    await expect(
      (async () => {
        await using _handle = await acquireWebLock(LockCriteria.ClientSync)
        throw error
      })()
    ).rejects.toBe(error)
    expect(held).toBeFalse()
  })
})
