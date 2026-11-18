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
      const { result } = renderHook(() => useExtPermissions(['management']))

      await expect(result.current[index]()).resolves.toBe(resolved)
      expect(mock).toHaveBeenCalledWith({ permissions: ['management'] })
    }
  )

  it.each<{ name: string; args: Parameters<typeof useExtPermissions> }>([
    { name: 'array', args: [['management', 'downloads']] },
    { name: 'variadic strings', args: ['management', 'downloads'] },
  ])('accepts permissions as $name', async ({ args }) => {
    mockRequest.mockResolvedValue(true)
    const { result } = renderHook(() => useExtPermissions(...args))

    await result.current[0]()

    expect(mockRequest).toHaveBeenCalledWith({
      permissions: ['management', 'downloads'],
    })
  })
})
