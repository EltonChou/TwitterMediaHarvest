/**
 * @jest-environment jsdom
 */
import { Client, ClientUUID } from '#domain/entities/client'
import { MockClientRepository } from '#mocks/repositories/client'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import useClient from './useClient'
import { act, renderHook, waitFor } from '@testing-library/react'

describe('unit test for useClient hook', () => {
  it('can provide client', async () => {
    const clientRepo = new MockClientRepository()
    const mockGetClient = jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue(toSuccessResult(generateClient()))

    const { result, unmount } = renderHook(() => useClient(clientRepo))

    await waitFor(() => {
      expect(result.current.isLoaded).toBeTruthy()
      expect(mockGetClient).toHaveBeenCalled()
    })

    unmount()
  })

  it('should ignore a result from a replaced repository', async () => {
    const staleRepo = new MockClientRepository()
    let resolveStale: (
      result: Awaited<ReturnType<typeof staleRepo.get>>
    ) => void = () => undefined
    jest
      .spyOn(staleRepo, 'get')
      .mockReturnValue(new Promise(resolve => (resolveStale = resolve)))

    const currentRepo = new MockClientRepository()
    const currentClient = generateClient()
    jest
      .spyOn(currentRepo, 'get')
      .mockResolvedValue(toSuccessResult(currentClient))

    const { result, rerender, unmount } = renderHook(
      ({ repo }) => useClient(repo),
      { initialProps: { repo: staleRepo } }
    )
    rerender({ repo: currentRepo })
    await waitFor(() =>
      expect(result.current.uuid).toBe(currentClient.id.value)
    )

    const staleClient = new Client(
      new ClientUUID('stale-uuid'),
      generateClient().mapBy((_id, props) => props)
    )
    await act(async () => resolveStale(toSuccessResult(staleClient)))

    expect(result.current.uuid).toBe(currentClient.id.value)
    unmount()
  })
})
