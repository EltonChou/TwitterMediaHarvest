/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type ThemeConfig, extendTheme } from '@chakra-ui/react'
import type { StyleFunctionProps } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  fonts: {
    heading:
      '"Homenaje", "Noto Sans JP", "Noto Sans TC", "Open Sans", sans-serif',
    body: '"Homenaje", "Noto Sans JP", "Noto Sans TC", sans-serif',
  },
  colors: {
    brand: {
      green: 'rgb(0, 186, 124)',
      red: '#DD277E',
      blue: '#414CE0',
      // yellow: '#F1BA1D',
      yellow: {
        50: '#F1BA1D',
        100: '#F1BA1D',
        200: '#F1BA1D',
        300: '#d8a40d',
        400: '#d8a40d',
        500: '#d8a40d',
        600: '#d8a40d',
        700: '#d8a40d',
        800: '#d8a40d',
        900: '#d8a40d',
      },
      pink: {
        50: '#d6438e',
        100: '#d6438e',
        200: '#d6438e',
        300: '#bc2975',
        400: '#bc2975',
        500: '#bc2975',
        600: '#bc2975',
        700: '#bc2975',
        800: '#bc2975',
        900: '#bc2975',
      },
      bg: '#1E1E1E',
    },
    token: {
      default: 'white',
      active: '#5AEDD2',
    },
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      html: {
        height: '100%',
      },
      body: {
        bg: props.colorMode === 'dark' ? '#1E1E1E' : 'inherit',
        color: props.colorMode === 'dark' ? 'white' : 'inherit',
        height: '100%',
        overflowY: 'auto',
      },
      '#root': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      },
    }),
  },
})

export default theme
