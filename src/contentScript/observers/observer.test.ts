/**
 * @jest-environment jsdom
 */
import observeElement from './observer'
import { screen, waitFor } from '@testing-library/dom'

describe('unit test for observer utils', () => {
  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('can observe element by query sring', () => {
    document.body.innerHTML = '<div id="root" data-testid="root"></div>'

    const mutationCallback = jest.fn()
    const observer = observeElement('root', '#root', mutationCallback, {
      childList: true,
      attributes: true,
    })

    expect(observer).toBeDefined()

    const root = screen.getByTestId('root')
    expect(root).toHaveAttribute('data-harvest-observe-id', 'root')

    // Trigger attributes mutation
    root.dataset['kappa'] = 'keepo'
    waitFor(() => expect(mutationCallback).toHaveBeenCalledTimes(1))

    // Trigger childlist mutation.
    const node = document.createElement('div')
    root.appendChild(node)

    waitFor(() => expect(mutationCallback).toHaveBeenCalledTimes(2))
  })

  it('can observe element by element', () => {
    document.body.innerHTML = '<div id="root" data-testid="root"></div>'

    const mutationCallback = jest.fn()
    const observer = observeElement(
      'root',
      screen.getByTestId('root'),
      mutationCallback,
      {
        childList: true,
        attributes: true,
      }
    )

    expect(observer).toBeDefined()

    const root = screen.getByTestId('root')
    expect(root).toHaveAttribute('data-harvest-observe-id', 'root')

    // Trigger attributes mutation
    root.dataset['kappa'] = 'keepo'
    waitFor(() => expect(mutationCallback).toHaveBeenCalledTimes(1))

    // Trigger childlist mutation.
    const node = document.createElement('div')
    root.appendChild(node)

    waitFor(() => expect(mutationCallback).toHaveBeenCalledTimes(1))
  })

  it('can ignore unexisting element', () => {
    document.body.innerHTML = '<div></div>'

    const mutationCallback = jest.fn()
    const observerByQuery = observeElement('root', '#root', mutationCallback)

    expect(observerByQuery).toBeUndefined()
  })
})
