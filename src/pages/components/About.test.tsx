/**
 * @jest-environment jsdom
 */
import { MockClientRepository } from '#mocks/repositories/client'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import About from './About'
import { render, screen, waitFor } from '@testing-library/react'
import 'core-js/stable/structured-clone'
import React from 'react'

describe('unit test for About component', () => {
  const clientRepo = new MockClientRepository()

  beforeAll(() => {
    jest
      .spyOn(clientRepo, 'get')
      .mockResolvedValue(toSuccessResult(generateClient()))
  })

  afterAll(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  it('can render properly', async () => {
    const { container, unmount } = render(
      <About clientRepo={clientRepo} cleanCache={jest.fn()} />
    )

    const links = screen.getAllByTestId('information-link')

    expect(links).toHaveLength(5)
    expect(container).toMatchSnapshot()

    unmount()
  })

  it('action button can clean cache', async () => {
    const mockCleanCache = jest.fn(async () => {})
    const { container, unmount } = render(
      <About clientRepo={clientRepo} cleanCache={mockCleanCache} />
    )

    const cleanCacheBtn = screen.getByTestId('clean-cache-btn')

    cleanCacheBtn.click()
    expect(mockCleanCache).toHaveBeenCalledOnce()
    await waitFor(() => expect(cleanCacheBtn).not.toBeDisabled())
    expect(container).toMatchSnapshot()

    unmount()
  })

  it('shows the idle icon before any action', () => {
    const { unmount } = render(
      <About clientRepo={clientRepo} cleanCache={jest.fn()} />
    )

    expect(screen.getByTestId('clean-cache-state-icon')).toHaveAttribute(
      'data-state',
      'idle'
    )

    unmount()
  })

  it('shows the success icon after cleaning cache', async () => {
    const mockCleanCache = jest.fn(async () => undefined)
    const { unmount } = render(
      <About clientRepo={clientRepo} cleanCache={mockCleanCache} />
    )

    screen.getByTestId('clean-cache-btn').click()

    await waitFor(() =>
      expect(screen.getByTestId('clean-cache-state-icon')).toHaveAttribute(
        'data-state',
        'success'
      )
    )

    unmount()
  })

  it('shows the failed icon when cleaning cache fails', async () => {
    const mockCleanCache = jest.fn(async () => new Error('boom'))
    const { unmount } = render(
      <About clientRepo={clientRepo} cleanCache={mockCleanCache} />
    )

    screen.getByTestId('clean-cache-btn').click()

    await waitFor(() =>
      expect(screen.getByTestId('clean-cache-state-icon')).toHaveAttribute(
        'data-state',
        'failed'
      )
    )

    unmount()
  })

  it('shows loading state while cleaning cache', async () => {
    let resolveClean: (value?: UnsafeTask) => void = () => undefined
    const mockCleanCache = jest.fn(
      () =>
        new Promise<UnsafeTask>(resolve => {
          resolveClean = resolve
        })
    )
    const { unmount } = render(
      <About clientRepo={clientRepo} cleanCache={mockCleanCache} />
    )

    const cleanCacheBtn = screen.getByTestId('clean-cache-btn')

    cleanCacheBtn.click()

    // Loading: button disabled while the promise is pending.
    await waitFor(() => expect(cleanCacheBtn).toBeDisabled())

    resolveClean(undefined)

    // Loading finished: button re-enabled.
    await waitFor(() => expect(cleanCacheBtn).not.toBeDisabled())

    unmount()
  })
})
