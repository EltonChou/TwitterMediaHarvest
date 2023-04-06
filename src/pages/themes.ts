import { extendTheme, type ThemeConfig } from '@chakra-ui/react'
import type { StyleFunctionProps } from '@chakra-ui/styled-system'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}
const theme = extendTheme({
  config,
  fonts: {
    heading: '"Homenaje", "Open Sans", sans-serif',
    body: '"Homenaje", "Raleway", sans-serif',
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
        overflowY: 'scroll',
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
