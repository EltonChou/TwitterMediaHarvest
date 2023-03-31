import { Box, FormLabel, HStack, Switch } from '@chakra-ui/react'
import React, { memo } from 'react'

type FeatureSwitchPros = {
  controlId?: string
  isOn: boolean
  handleChange: () => void
  labelContent: string
}

export const FeatureSwitch = memo(({ controlId, isOn, handleChange, labelContent }: FeatureSwitchPros) => {
  return (
    <HStack>
      <FormLabel htmlFor={controlId} mb="0" flex={1} cursor="pointer" fontSize={'x-large'}>
        {labelContent}
      </FormLabel>
      <Box>
        <Switch id={controlId} isChecked={isOn} onChange={handleChange} colorScheme="teal" />
      </Box>
    </HStack>
  )
})
