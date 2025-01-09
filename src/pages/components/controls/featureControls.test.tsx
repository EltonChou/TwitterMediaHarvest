/**
 * @jest-environment jsdom
 */
import { FeatureSwitch, RichFeatureSwitch } from './featureControls'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

describe('unit test for FeatureSwitch', () => {
  it('can render properly', () => {
    const mockChange = jest.fn()

    const { container, unmount } = render(
      <FeatureSwitch
        isOn={true}
        handleChange={mockChange}
        labelContent="label-content"
      />
    )

    const label = screen.getByTestId('feature-switch-label')
    const switch_ = screen.getByTestId<HTMLInputElement>('feature-switch')
    fireEvent(switch_, new MouseEvent('click'))

    expect(label.textContent).toBe('label-content')
    expect(mockChange).toHaveBeenCalled()

    expect(container).toMatchSnapshot()

    unmount()
  })
})

describe('unit test for RichFeatureSwitch', () => {
  it('can render properly with info message', () => {
    const mockChange = jest.fn()

    const { container, unmount } = render(
      <RichFeatureSwitch
        name="feature-name"
        desc="feature-desc"
        isOn={false}
        handleClick={mockChange}
        children={<span data-testid="kappa">kappa</span>}
        message={{ type: 'info', content: 'some information' }}
        cursor="pointer"
        testId="rich-feature-switch"
      />
    )
    const label = screen.getByTestId('feature-switch-label')
    const switch_ = screen.getByTestId<HTMLInputElement>('feature-switch')

    waitFor(() => {
      expect(screen.getByTestId('feature-switch-helper-text')).toBeVisible()
      expect(screen.getByTestId('kappa')).toBeVisible()
      expect(screen.getByText('some information')).toBeVisible()
      expect(label).toHaveStyle({ cursor: 'pointer' })
    })

    fireEvent(label, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(1)
    fireEvent(switch_, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(2)

    expect(container).toMatchSnapshot()

    unmount()
  })

  it('can render properly with error message', () => {
    const mockChange = jest.fn()

    const { container, unmount } = render(
      <RichFeatureSwitch
        name="feature-name"
        desc="feature-desc"
        isOn={false}
        handleClick={mockChange}
        children={<span data-testid="kappa">kappa</span>}
        message={{ type: 'error', content: 'some information' }}
        cursor="pointer"
        testId="rich-feature-switch"
      />
    )
    const label = screen.getByTestId('feature-switch-label')
    const switch_ = screen.getByTestId<HTMLInputElement>('feature-switch')

    waitFor(() => {
      expect(screen.getByTestId('feature-switch-helper-text')).toBeVisible()
      expect(screen.getByTestId('kappa')).toBeVisible()
      expect(screen.getByText('some information')).toBeVisible()
      expect(label).toHaveStyle({ cursor: 'pointer' })
    })

    fireEvent(label, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(1)
    fireEvent(switch_, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(2)

    expect(container).toMatchSnapshot()

    unmount()
  })

  it('can render properly with empty message', () => {
    const mockChange = jest.fn()

    const { container, unmount } = render(
      <RichFeatureSwitch
        name="feature-name"
        desc="feature-desc"
        isOn={false}
        handleClick={mockChange}
        children={<span data-testid="kappa">kappa</span>}
        cursor="default"
        testId="rich-feature-switch"
      />
    )
    const label = screen.getByTestId('feature-switch-label')
    const switch_ = screen.getByTestId<HTMLInputElement>('feature-switch')

    waitFor(() => {
      expect(screen.getByTestId('feature-switch-helper-text')).not.toBeVisible()
      expect(screen.getByTestId('kappa')).toBeVisible()
      expect(label).toHaveStyle({ cursor: 'default' })
    })

    fireEvent(label, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(1)
    fireEvent(switch_, new MouseEvent('click'))
    expect(mockChange).toHaveBeenCalledTimes(2)

    expect(container).toMatchSnapshot()

    unmount()
  })

  it('can render properly when disabled', () => {
    const mockChange = jest.fn()

    const { container, unmount } = render(
      <RichFeatureSwitch
        name="feature-name"
        desc="feature-desc"
        isOn={false}
        isDisable={true}
        handleClick={mockChange}
        children={<span data-testid="kappa">kappa</span>}
        message={{ type: 'error', content: 'some information' }}
        testId="rich-feature-switch" /*  */
      />
    )
    const label = screen.getByTestId('feature-switch-label')
    const switch_ = screen.getByTestId<HTMLInputElement>('feature-switch')

    waitFor(() => {
      expect(screen.getByTestId('kappa')).toBeVisible()
      expect(label).toHaveStyle({ cursor: 'not-allowed' })
    })

    fireEvent(label, new MouseEvent('click'))
    expect(mockChange).not.toHaveBeenCalled()
    fireEvent(switch_, new MouseEvent('click'))
    expect(mockChange).not.toHaveBeenCalled()

    expect(container).toMatchSnapshot()

    unmount()
  })
})
