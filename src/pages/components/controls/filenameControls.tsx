import { Box, useBoolean } from '@chakra-ui/react'
import React, { memo } from 'react'

type PatternTokenProps = {
  tokenName: string
  isOn: boolean
  handleChange?: (state: boolean) => void
}

export const PatternToken = memo(
  ({ tokenName, isOn, handleChange }: PatternTokenProps) => {
    const [state, setState] = useBoolean(isOn)
    return (
      <Box
        pl={'1em'}
        pr={'1em'}
        fontSize={'1em'}
        fontWeight={'medium'}
        color={'gray.900'}
        borderRadius={'full'}
        bg={state ? 'token.active' : 'white'}
        cursor="pointer"
        onClick={() => {
          setState.toggle()
          handleChange(!state)
        }}
      >
        {tokenName}
      </Box>
    )
  }
)
