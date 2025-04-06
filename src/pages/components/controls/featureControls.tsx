/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import useLocaleVariables from '#pages/hooks/useLocaleVariables'
import type { TestableComponent } from '#pages/types/props'
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
import type { JSX } from 'react'
import React, { useId } from 'react'

type FeatureSwitchProps = {
  isOn: boolean
  handleChange: () => void
  labelContent: string
}

export const FeatureSwitch = ({
  isOn,
  handleChange,
  labelContent,
}: FeatureSwitchProps) => {
  const controlId = useId()
  const switchMb = useLocaleVariables({
    fallback: 'unset',
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
        data-testid="feature-switch-label"
      >
        {labelContent}
      </FormLabel>
      <Switch
        id={controlId}
        isChecked={isOn}
        onChange={handleChange}
        colorScheme="cyan"
        mb={switchMb}
        data-testid="feature-switch"
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
      <SlideFade offsetY={'10px'} in={Boolean(message)} reverse={true}>
        <HStack height={'1em'}>
          <Icon as={icon} color={color} />
          <FormHelperText
            color={color}
            data-testid="feature-switch-helper-text"
          >
            {message.content}
          </FormHelperText>
        </HStack>
      </SlideFade>
    </>
  )
}

export interface RichFeatureSwithProps extends TestableComponent {
  name: string
  desc: string | JSX.Element
  isOn: boolean
  handleClick?: () => void
  isDisable?: boolean
  message?: HelperMessage | undefined
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
  testId,
}: RichFeatureSwithProps) => {
  const id = useId()
  return (
    <FormControl label={name} isDisabled={isDisable} data-testid={testId}>
      <FormLabel
        htmlFor={id}
        cursor={isDisable ? 'not-allowed' : cursor}
        marginInlineEnd={0}
        fontSize={'1em'}
        data-testid="feature-switch-label"
      >
        <HStack
          spacing={8}
          p={'1.5rem'}
          _hover={{ bg: 'rgba(255,255,255,0.05)' }}
          style={{ transition: 'background 300ms' }}
        >
          <Stack flex={1}>
            <Text
              fontSize={'1.5em'}
              lineHeight={'none'}
              textTransform={'capitalize'}
            >
              {name}
            </Text>
            <Text color={'gray.400'}>{desc}</Text>
            <HelperText message={message} />
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
                data-testid="feature-switch"
              />
            </Box>
          )}
        </HStack>
      </FormLabel>
    </FormControl>
  )
}
