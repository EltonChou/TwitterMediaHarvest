import { extendTheme } from '@chakra-ui/react'
import type { StyleFunctionProps } from '@chakra-ui/styled-system'

const theme = extendTheme({
  fonts: {
    heading: '"Homenaje", "Open Sans", sans-serif',
    body: '"Homenaje", "Raleway", sans-serif',
  },
  styles: {
    global: (props: StyleFunctionProps) => ({
      body: {
        bg: '#1E1E1E',
        color: 'white',
      },
    }),
  },
})

export default theme
