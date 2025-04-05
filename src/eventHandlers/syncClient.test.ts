import { DomainEvent } from '#domain/events/base'
import type { Lock, LockContext } from '#libs/locks/types'
import { MockEventPublisher } from '#mocks/eventPublisher'
import { MockClientRepository } from '#mocks/repositories/client'
import { generateClient } from '#utils/test/client'
import { syncClient } from './syncClient'

describe('unit test for handler to sync client', () => {
  const clientRepo = new MockClientRepository()
  const publisher = new MockEventPublisher()

  const lock: Lock = {
    name: 'lock',
  }

  class TestEvent extends DomainEvent {}

  afterEach(() => jest.resetAllMocks())

  it('can sync client', async () => {
    const lockCtx: LockContext<UnsafeTask> = jest
      .fn()
      .mockImplementation(async task => await task(lock))
    const handler = syncClient(lockCtx)(clientRepo)

    const mockGet = jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue({ value: generateClient(0), error: undefined })
    const mockSync = jest
      .spyOn(clientRepo, 'sync')
      .mockImplementation(jest.fn())

    await handler(new TestEvent('download:status:completed'), publisher)

    expect(mockGet).toHaveBeenCalled()
    expect(lockCtx).toHaveBeenCalled()
    expect(mockSync).toHaveBeenCalled()
  })

  it('can skip syncing if the client has been synced in this time window', async () => {
    const lockCtx: LockContext<UnsafeTask> = jest
      .fn()
      .mockImplementation(async task => await task(lock))
    const handler = syncClient(lockCtx)(clientRepo)

    const mockGet = jest.spyOn(clientRepo, 'get').mockResolvedValue({
      value: generateClient(Date.now()),
      error: undefined,
    })
    const mockSync = jest
      .spyOn(clientRepo, 'sync')
      .mockImplementation(jest.fn())

    await handler(new TestEvent('download:status:completed'), publisher)

    expect(lockCtx).toHaveBeenCalledOnce()
    expect(mockGet).toHaveBeenCalled()
    expect(mockSync).not.toHaveBeenCalled()
  })

  it('can skip syncing if handler failed to get the lock', async () => {
    const lockCtx: LockContext<UnsafeTask> = jest
      .fn()
      .mockImplementation(async task => await task(null))
    const handler = syncClient(lockCtx)(clientRepo)

    const mockGet = jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue({ value: generateClient(0), error: undefined })
    const mockSync = jest
      .spyOn(clientRepo, 'sync')
      .mockImplementation(jest.fn())

    await handler(new TestEvent('download:status:completed'), publisher)

    expect(lockCtx).toHaveBeenCalledOnce()
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockSync).not.toHaveBeenCalled()
  })
})
