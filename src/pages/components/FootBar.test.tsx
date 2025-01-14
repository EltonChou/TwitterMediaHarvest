/**
 * @jest-environment jsdom
 */
import FootBar from './FootBar'
import { queryByTestId, render } from '@testing-library/react'
import 'core-js/stable/structured-clone'
import React from 'react'

describe('unit test for FootBar component', () => {
  it('can render properly', () => {
    const { unmount, container } = render(<FootBar />)

    expect(queryByTestId(container, 'coffee-button')).toBeInTheDocument()
    expect(queryByTestId(container, 'rate-button')).toBeInTheDocument()
    expect(container).toMatchSnapshot()

    unmount()
  })
})
