import { DomainEvent } from '#domain/events/base'
import type { Lock, LockAcquirer } from '#libs/locks/types'
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

  const makeAcquirer = (lock: Lock | null) => {
    const release = jest.fn()
    const acquire = jest.fn<ReturnType<LockAcquirer>, []>().mockResolvedValue({
      lock,
      [Symbol.asyncDispose]: release,
    })
    return { acquire, release }
  }

  afterEach(() => jest.resetAllMocks())

  it('can sync client', async () => {
    const { acquire: lockCtx, release } = makeAcquirer(lock)
    const handler = syncClient(lockCtx)(clientRepo)

    const mockGet = jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue({ value: generateClient(0), error: undefined })
    const mockSync = jest
      .spyOn(clientRepo, 'sync')
      .mockImplementation(jest.fn())
    const mockPublishAll = jest.spyOn(publisher, 'publishAll')

    await handler(new TestEvent('download:status:completed'), publisher)

    expect(mockGet).toHaveBeenCalled()
    expect(lockCtx).toHaveBeenCalled()
    expect(mockSync).toHaveBeenCalled()
    expect(release).toHaveBeenCalledOnce()
    expect(release).toHaveBeenCalledBefore(mockPublishAll)
  })

  it('can skip syncing if the client has been synced in this time window', async () => {
    const { acquire: lockCtx, release } = makeAcquirer(lock)
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
    expect(release).toHaveBeenCalledOnce()
  })

  it('can skip syncing if handler failed to get the lock', async () => {
    const { acquire: lockCtx, release } = makeAcquirer(null)
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
    expect(release).toHaveBeenCalledOnce()
  })

  it('releases the lock when syncing throws', async () => {
    const { acquire: lockCtx, release } = makeAcquirer(lock)
    const handler = syncClient(lockCtx)(clientRepo)
    const error = new Error('sync failed')

    jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue({ value: generateClient(0), error: undefined })
    jest.spyOn(clientRepo, 'sync').mockRejectedValue(error)

    await expect(
      handler(new TestEvent('download:status:completed'), publisher)
    ).rejects.toBe(error)
    expect(release).toHaveBeenCalledOnce()
  })
})
