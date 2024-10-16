/**
 * @jest-environment jsdom
 */
import { PatternToken, SortablePatternToken } from './filenameControls'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

describe('unit test for pattern token component', () => {
  it('can render properly', () => {
    const mockChange = jest.fn()
    const { container, unmount } = render(
      <PatternToken
        tokenName={'token'}
        isOn={false}
        handleChange={mockChange}
        testId="pattern-token"
      />
    )

    act(() => {
      fireEvent.click(screen.getByTestId('pattern-token'))
    })

    expect(mockChange).toHaveBeenCalled()
    expect(container).toMatchSnapshot()

    unmount()
  })
})

describe('unit test for sortable pattern token component', () => {
  it('can render properly', () => {
    const mockRemove = jest.fn()
    const { container, unmount } = render(
      <SortablePatternToken
        token={'token'}
        name={'token'}
        handleRemove={mockRemove}
        testId="sortable-pattern-token"
      />
    )

    act(() => {
      fireEvent.click(screen.getByTestId('sortable-pattern-token-close'))
    })

    expect(mockRemove).toHaveBeenCalled()
    expect(container).toMatchSnapshot()

    unmount()
  })
})
