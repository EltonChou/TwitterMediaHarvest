import { InfoIcon, WarningTwoIcon } from '@chakra-ui/icons'
import { Box, FormControl, FormHelperText, FormLabel, HStack, Icon, Stack, Switch, Text } from '@chakra-ui/react'
import React, { memo, useId } from 'react'

type FeatureSwitchPros = {
  isOn: boolean
  handleChange: () => void
  labelContent: string
}

export const FeatureSwitch = memo(({ isOn, handleChange, labelContent }: FeatureSwitchPros) => {
  const controlId = useId()
  return (
    <HStack>
      <FormLabel htmlFor={controlId} mb="0" flex={1} cursor="pointer" fontSize={'x-large'}>
        {labelContent}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} colorScheme="teal" />
    </HStack>
  )
})

export type HelperMessage = {
  type: 'info' | 'error'
  content: string
}

type RichFeatureSwithProps = {
  name: string
  desc: string | JSX.Element
  isOn?: boolean
  handleClick?: () => void
  isDisable?: boolean
  message?: HelperMessage
  children?: JSX.Element
}

type HelperTextProps = {
  message: HelperMessage
}

const HelperText = ({ message }: HelperTextProps) => {
  const color = message.type === 'info' ? 'green.200' : 'red.200'
  const icon = message.type === 'info' ? InfoIcon : WarningTwoIcon
  return (
    <>
      <Icon as={icon} color={color} />
      <FormHelperText color={color}>{message.content}</FormHelperText>
    </>
  )
}

export const RichFeatureSwitch = ({
  name,
  desc,
  isOn,
  handleClick,
  isDisable,
  message,
  children,
}: RichFeatureSwithProps) => {
  const id = useId()
  return (
    <FormControl label={name} isDisabled={isDisable}>
      <FormLabel htmlFor={id} cursor={isDisable ? 'not-allowed' : 'pointer'} marginInlineEnd={0} fontSize={'1em'}>
        <HStack spacing={8} p={'1.5rem'} _hover={{ bg: 'rgba(255,255,255,0.05)' }}>
          <Stack flex={1}>
            <Text fontSize={'1.5em'} lineHeight={1}>
              {name}
            </Text>
            <Text color={'gray.400'}>{desc}</Text>
            {message ? (
              <HStack>
                <HelperText message={message} />
              </HStack>
            ) : (
              <HStack height={'1em'}></HStack>
            )}
            {children}
          </Stack>
          {handleClick && (
            <Box alignSelf={'stretch'}>
              <Switch id={id} isChecked={isOn} onChange={handleClick} />
            </Box>
          )}
        </HStack>
      </FormLabel>
    </FormControl>
  )
}
