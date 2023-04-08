import React from 'react'

import { Box, useBoolean } from '@chakra-ui/react'

type PatternTokenProps = {
  tokenName: string
  isOn: boolean
  handleChange?: (state: boolean) => void
}

export const PatternToken = ({ tokenName, isOn, handleChange }: PatternTokenProps) => {
  const [state, setState] = useBoolean(isOn)
  return (
    <Box
      pl={'1em'}
      pr={'1em'}
      fontSize={'1em'}
      fontWeight={500}
      color={'black'}
      borderRadius={'2xl'}
      bg={state ? 'green.300' : 'white'}
      onClick={() => {
        setState.toggle()
        handleChange(!state)
      }}
    >
      {tokenName}
    </Box>
  )
}
