/**
 * @jest-environment jsdom
 */
import { MockClientRepository } from '#mocks/repositories/client'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import useClient from './useClient'
import { renderHook, waitFor } from '@testing-library/react'

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
})
