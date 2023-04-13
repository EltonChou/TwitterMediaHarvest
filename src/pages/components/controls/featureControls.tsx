import React, { useId } from 'react'

import { InfoIcon, WarningTwoIcon } from '@chakra-ui/icons'
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  SlideFade,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react'
import useLocaleVariables from '@pages/hooks/useLocaleVariables'

type FeatureSwitchPros = {
  isOn: boolean
  handleChange: () => void
  labelContent: string
}

export const FeatureSwitch = ({ isOn, handleChange, labelContent }: FeatureSwitchPros) => {
  const controlId = useId()
  const switchMb = useLocaleVariables({ base: 'unset', ja: '4px !important', zh: '4px !important' })
  return (
    <HStack>
      <FormLabel htmlFor={controlId} mb="0" flex={1} cursor="pointer" fontSize={'inherit'}>
        {labelContent}
      </FormLabel>
      <Switch id={controlId} isChecked={isOn} onChange={handleChange} colorScheme="cyan" mb={switchMb} />
    </HStack>
  )
}

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
  message?: HelperMessage
}

const HelperText = ({ message }: HelperTextProps) => {
  if (!message) return <> </>
  const color = message.type === 'info' ? 'brand.green' : 'brand.red'
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
        <HStack
          spacing={8}
          p={'1.5rem'}
          _hover={{ bg: 'rgba(255,255,255,0.05)' }}
          _active={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          style={{ transition: 'background 300ms' }}
        >
          <Stack flex={1}>
            <Text fontSize={'1.5em'} lineHeight={'none'}>
              {name}
            </Text>
            <Text color={'gray.400'}>{desc}</Text>
            <SlideFade offsetY={'10px'} in={Boolean(message)} reverse>
              <HStack height={'1em'}>
                <HelperText message={message} />
              </HStack>
            </SlideFade>
            {children}
          </Stack>
          {handleClick && (
            <Box alignSelf={'stretch'}>
              <Switch id={id} isChecked={isOn} onChange={handleClick} colorScheme={'cyan'} size={'md'} />
            </Box>
          )}
        </HStack>
      </FormLabel>
    </FormControl>
  )
}
