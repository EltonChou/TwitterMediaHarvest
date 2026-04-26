/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { XTransactionId } from '#domain/valueObjects/xTransactionId'
import { XTransactionIdCache } from '#infra/caches/xApiTransactionId'
import { MessagePortName } from '#libs/webExtMessage/port'
import { makeMockPort } from '#mocks/port'

const makeTxId = (
  overrides: Partial<{ method: string; value: string; path: string }> = {}
): XTransactionId =>
  new XTransactionId({
    method: 'GET',
    value: 'tx-abc',
    path: '/api/endpoint',
    ...overrides,
  })

describe('XTransactionIdCache', () => {
  it('returns a stored item without posting through the port', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)
    const item = makeTxId()

    await cache.save(item)
    const result = await cache.get(['/api/endpoint', 'GET'])

    expect(result.value).toBe(item)
    expect(port.postMessage).not.toHaveBeenCalled()
  })

  it('consumes the stored item so it cannot be read twice', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)

    await cache.save(makeTxId())
    await cache.get(['/api/endpoint', 'GET'])

    const second = cache.get(['/api/endpoint', 'GET'])
    expect(port.postMessage).toHaveBeenCalledTimes(1)
    // Don't await — it would block on the pending request.
    second.catch(() => undefined)
  })

  it('posts a RequestTransactionIdMessage through the port when empty', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)

    cache.get(['/api/endpoint', 'GET']).catch(() => undefined)

    expect(port.postMessage).toHaveBeenCalledWith({
      action: 'request-tx-id',
      payload: { path: '/api/endpoint', method: 'GET' },
    })
  })

  it('resolves a pending get when save arrives with the matching key', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)

    const pending = cache.get(['/api/endpoint', 'GET'])
    const item = makeTxId()
    await cache.save(item)

    const result = await pending
    expect(result.value).toBe(item)
  })

  it('errors when get times out', async () => {
    jest.useFakeTimers()
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port, { timeout: 500 })

    const pending = cache.get(['/api/endpoint', 'GET'])
    jest.advanceTimersByTime(500)
    const result = await pending

    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toMatch(/timed out/i)
    jest.useRealTimers()
  })

  it('drops the resolver on timeout so a late save does not feed a dead waiter', async () => {
    jest.useFakeTimers()
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port, { timeout: 500 })

    const pending = cache.get(['/api/endpoint', 'GET'])
    jest.advanceTimersByTime(500)
    await pending

    const lateItem = makeTxId()
    await cache.save(lateItem)

    // Late save should land in the store, not resolve a stale waiter.
    jest.useRealTimers()
    const next = await cache.get(['/api/endpoint', 'GET'])
    expect(next.value).toBe(lateItem)
  })

  it('serves stored items in FIFO order', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)
    const first = makeTxId({ value: 'first' })
    const second = makeTxId({ value: 'second' })

    await cache.save(first)
    await cache.save(second)

    const a = await cache.get(['/api/endpoint', 'GET'])
    const b = await cache.get(['/api/endpoint', 'GET'])
    expect(a.value).toBe(first)
    expect(b.value).toBe(second)
  })

  it('evicts the oldest item when maxPerKey is exceeded', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port, { maxPerKey: 2 })
    const a = makeTxId({ value: 'a' })
    const b = makeTxId({ value: 'b' })
    const c = makeTxId({ value: 'c' })

    await cache.save(a)
    await cache.save(b)
    await cache.save(c)

    const first = await cache.get(['/api/endpoint', 'GET'])
    const second = await cache.get(['/api/endpoint', 'GET'])
    expect(first.value).toBe(b)
    expect(second.value).toBe(c)
  })

  it('routes concurrent pending gets to distinct saves in order', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)

    const firstGet = cache.get(['/api/endpoint', 'GET'])
    const secondGet = cache.get(['/api/endpoint', 'GET'])

    const first = makeTxId({ value: 'first' })
    const second = makeTxId({ value: 'second' })
    await cache.save(first)
    await cache.save(second)

    expect((await firstGet).value).toBe(first)
    expect((await secondGet).value).toBe(second)
  })

  it('isolates keys that share a path but differ in method', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)
    const getItem = makeTxId({ method: 'GET', value: 'get-value' })
    const postItem = makeTxId({ method: 'POST', value: 'post-value' })

    await cache.save(getItem)
    await cache.save(postItem)

    const getResult = await cache.get(['/api/endpoint', 'GET'])
    const postResult = await cache.get(['/api/endpoint', 'POST'])
    expect(getResult.value).toBe(getItem)
    expect(postResult.value).toBe(postItem)
  })

  it('saveAll populates the store for each item', async () => {
    const port = makeMockPort(MessagePortName.ContentScript)
    const cache = new XTransactionIdCache(() => port)
    const a = makeTxId({ value: 'a' })
    const b = makeTxId({ value: 'b', path: '/other' })

    const error = await cache.saveAll(a, b)
    expect(error).toBeUndefined()

    const first = await cache.get(['/api/endpoint', 'GET'])
    const second = await cache.get(['/other', 'GET'])
    expect(first.value).toBe(a)
    expect(second.value).toBe(b)
  })
})
