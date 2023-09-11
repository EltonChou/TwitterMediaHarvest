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
import React, { useId } from 'react'

type FeatureSwitchPros = {
  isOn: boolean
  handleChange: () => void | Promise<void>
  labelContent: string
}

export const FeatureSwitch = ({
  isOn,
  handleChange,
  labelContent,
}: FeatureSwitchPros) => {
  const controlId = useId()
  const switchMb = useLocaleVariables({
    base: 'unset',
    ja: '4px !important',
    zh: '4px !important',
  })
  return (
    <HStack>
      <FormLabel
        htmlFor={controlId}
        mb="0"
        flex={1}
        cursor="pointer"
        fontSize={'inherit'}
      >
        {labelContent}
      </FormLabel>
      <Switch
        id={controlId}
        isChecked={isOn}
        onChange={handleChange}
        colorScheme="cyan"
        mb={switchMb}
      />
    </HStack>
  )
}

export type HelperMessage = {
  type: 'info' | 'error'
  content: string
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
      <FormHelperText color={color}>{'' || message.content}</FormHelperText>
    </>
  )
}

type RichFeatureSwithProps = {
  name: string
  desc: string | JSX.Element
  isOn?: boolean
  handleClick?: () => void
  isDisable?: boolean
  message?: HelperMessage
  children?: JSX.Element
  cursor?: 'default' | 'pointer'
}

export const RichFeatureSwitch = ({
  name,
  desc,
  isOn,
  handleClick,
  isDisable,
  message,
  children,
  cursor = 'pointer',
}: RichFeatureSwithProps) => {
  const id = useId()
  return (
    <FormControl label={name} isDisabled={isDisable}>
      <FormLabel
        htmlFor={id}
        cursor={isDisable ? 'not-allowed' : cursor}
        marginInlineEnd={0}
        fontSize={'1em'}
      >
        <HStack
          spacing={8}
          p={'1.5rem'}
          _hover={{ bg: 'rgba(255,255,255,0.05)' }}
          style={{ transition: 'background 300ms' }}
        >
          <Stack flex={1}>
            <Text fontSize={'1.5em'} lineHeight={'none'} textTransform={'capitalize'}>
              {name}
            </Text>
            <Text color={'gray.400'}>{desc}</Text>
            <SlideFade offsetY={'10px'} in={Boolean(message)} reverse={true}>
              <HStack height={'1em'}>
                <HelperText message={message} />
              </HStack>
            </SlideFade>
            {children}
          </Stack>
          {handleClick && (
            <Box alignSelf={'stretch'}>
              <Switch
                id={id}
                isChecked={isOn}
                onChange={handleClick}
                colorScheme={'cyan'}
                size={'md'}
              />
            </Box>
          )}
        </HStack>
      </FormLabel>
    </FormControl>
  )
}
