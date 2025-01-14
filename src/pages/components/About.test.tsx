/**
 * @jest-environment jsdom
 */
import { MockClientRepository } from '#mocks/repositories/client'
import { toSuccessResult } from '#utils/result'
import { generateClient } from '#utils/test/client'
import About from './About'
import { render, screen } from '@testing-library/react'
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
    const { container, unmount } = render(<About clientRepo={clientRepo} />)

    const links = screen.getAllByTestId('information-link')

    expect(links).toHaveLength(5)
    expect(container).toMatchSnapshot()

    unmount()
  })
})
