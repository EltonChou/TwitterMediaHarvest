/**
 * @jest-environment jsdom
 */
import { Path } from '#pages/routes'
import theme from '#pages/themes'
import SideMenu from './SideMenu'
import { ChakraProvider } from '@chakra-ui/react'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import React from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'

jest.mock('@chakra-ui/media-query', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@chakra-ui/media-query'),
    useBreakpointValue: () => 'inherit',
  }
})

describe('unit test for SideMenu component', () => {
  afterAll(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('can navigate', async () => {
    const { container, unmount } = render(
      <>
        <ChakraProvider theme={theme}>
          <SideMenu />
        </ChakraProvider>
        <Routes>
          <Route path={Path.General} element={<h1>general</h1>} />
          <Route path={Path.Features} element={<h1>features</h1>} />
          <Route path={Path.Integrations} element={<h1>integrations</h1>} />
          <Route path={Path.History} element={<h1>history</h1>} />
          <Route path={Path.About} element={<h1>about</h1>} />
        </Routes>
      </>,
      { wrapper: HashRouter }
    )

    const user = userEvent.setup()

    expect(container).toMatchSnapshot()

    const testCase = [
      { navItemTestId: 'nav-item-general', text: 'general' },
      { navItemTestId: 'nav-item-features', text: 'features' },
      { navItemTestId: 'nav-item-integrations', text: 'integrations' },
      { navItemTestId: 'nav-item-history', text: 'history' },
      { navItemTestId: 'nav-item-about', text: 'about' },
    ]

    for (const { navItemTestId, text } of testCase) {
      await user.click(screen.getByTestId(navItemTestId))
      expect(screen.getByText(text)).toBeInTheDocument()
    }

    await user.click(screen.getByTestId('side-menu-burger'))
    await user.click(screen.getByTestId('side-menu-dimmed'))

    unmount()
  })
})
