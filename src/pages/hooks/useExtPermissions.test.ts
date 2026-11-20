/**
 * @jest-environment jsdom
 */
import useExtPermissions from './useExtPermissions'
import { renderHook } from '@testing-library/react'
import { permissions } from 'webextension-polyfill'

describe('unit test for useExtPermissions hook', () => {
  const mockRequest = jest.fn()
  const mockRemove = jest.fn()

  beforeAll(() => {
    permissions.request = mockRequest
    permissions.remove = mockRemove
  })

  afterEach(() => jest.clearAllMocks())

  it.each([
    { name: 'grant', index: 0 as const, mock: mockRequest, resolved: true },
    {
      name: 'grant denied',
      index: 0 as const,
      mock: mockRequest,
      resolved: false,
    },
    { name: 'revoke', index: 1 as const, mock: mockRemove, resolved: true },
  ])(
    '$name forwards permissions and result',
    async ({ index, mock, resolved }) => {
      mock.mockResolvedValue(resolved)
      const { result } = renderHook(() => useExtPermissions('management'))

      await expect(result.current[index]()).resolves.toBe(resolved)
      expect(mock).toHaveBeenCalledWith({ permissions: ['management'] })
    }
  )

  it.each([
    { name: 'grant', index: 0 as const, mock: mockRequest },
    { name: 'revoke', index: 1 as const, mock: mockRemove },
  ])(
    '$name resolves false when the browser rejects',
    async ({ index, mock }) => {
      mock.mockRejectedValue(new Error('not allowed'))
      const { result } = renderHook(() => useExtPermissions('management'))

      await expect(result.current[index]()).resolves.toBeFalse()
    }
  )

  it('forwards every permission given', async () => {
    mockRequest.mockResolvedValue(true)
    const { result } = renderHook(() =>
      useExtPermissions('management', 'downloads')
    )

    await result.current[0]()

    expect(mockRequest).toHaveBeenCalledWith({
      permissions: ['management', 'downloads'],
    })
  })

  it.each<{
    name: string
    next: Parameters<typeof useExtPermissions>
    keepsCallbacks: boolean
  }>([
    {
      name: 'same permissions',
      next: ['management'],
      keepsCallbacks: true,
    },
    {
      name: 'different permissions',
      next: ['downloads'],
      keepsCallbacks: false,
    },
  ])('rerender with $name', async ({ next, keepsCallbacks }) => {
    mockRequest.mockResolvedValue(true)
    const { result, rerender } = renderHook(
      ({ args }) => useExtPermissions(...args),
      {
        initialProps: {
          args: ['management'] as Parameters<typeof useExtPermissions>,
        },
      }
    )
    const [grant, revoke] = result.current

    rerender({ args: next })

    expect(result.current[0] === grant).toBe(keepsCallbacks)
    expect(result.current[1] === revoke).toBe(keepsCallbacks)
    await result.current[0]()
    expect(mockRequest).toHaveBeenCalledWith({ permissions: next })
  })
})
