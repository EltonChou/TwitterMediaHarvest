import { getText as i18n } from '#libs/i18n'
import { Beta } from '#pages/helpers/text'
import {
  ExtensionStatus,
  WorkflowStatus,
  useExtensionConflictDiagnostic,
} from '#pages/hooks/useExtensionConflictDiagnostic'
import { getRuntimeId } from '#utils/runtime'
import { Button, HStack, Icon, Stack, Text } from '@chakra-ui/react'
import React from 'react'
import { FaCheck, FaQuestion, FaXmark } from 'react-icons/fa6'

const ExtensionStatusIcon = {
  [ExtensionStatus.COMPATIBLE]: <Icon as={FaCheck} color={'brand.green'} />,
  [ExtensionStatus.CONFLICTED]: <Icon as={FaXmark} color={'brand.red'} />,
  [ExtensionStatus.UNKNOWN]: <Icon as={FaQuestion} color={'gray.500'} />,
}

type DiagnosticItemProps = {
  name: string
}

const confirmPrompt =
  i18n('Are you sure to start diagnostics?', 'options:diagnostics') +
  '\n' +
  i18n(
    'Other extensions will be temporarily disabled during diagnositc, please ensure your working sessions have been saved.',
    'options:diagnostics'
  ) +
  '\n' +
  i18n(
    'This diagnostic might take few minutes to done, depends on how many extensions you installed.',
    'options:diagnostics'
  )

// TODO: Make it generic to support more diagnostics in the future
const DiagnosticItem = (props: DiagnosticItemProps) => {
  const { installed, status, message, disableConflicted, diagnose, abort } =
    useExtensionConflictDiagnostic([getRuntimeId()])

  return (
    <Stack p={'1.5rem'} spacing={2}>
      <Text fontSize={'1.5em'} autoCapitalize="on" lineHeight={'none'}>
        {props.name}
        <Beta />
      </Text>
      <Text color={'gray.400'}>
        {i18n(
          'This diagnostic will check your installed extensions that might conflict with this extension.',
          'options:diagnostics'
        )}
      </Text>
      <Text>{message}</Text>
      <HStack>
        {WorkflowStatus.RUNNING === status ? (
          <Button onClick={abort}>Abort</Button>
        ) : (
          <Button
            onClick={async () => {
              if (confirm(confirmPrompt)) await diagnose()
            }}
          >
            {i18n('Diagnostic', 'options:diagnostics')}
          </Button>
        )}
        <Button
          onClick={disableConflicted}
          isDisabled={
            !(
              WorkflowStatus.COMPLETED === status &&
              Object.entries(installed)
                .map(([_, { status }]) => status)
                .some(status => ExtensionStatus.CONFLICTED === status)
            )
          }
        >
          {i18n('Disable', 'options:diagnostics')}
        </Button>
      </HStack>
      <Stack pt={4}>
        {Object.entries(installed).map(([id, { status, name }]) => (
          <HStack key={id}>
            {ExtensionStatusIcon[status]}
            <p>{name}</p>
          </HStack>
        ))}
      </Stack>
    </Stack>
  )
}

const Diagnostics = () => {
  return (
    <Stack>
      <DiagnosticItem
        name={i18n('Conflict Extensions', 'options:diagnostics')}
      />
    </Stack>
  )
}

export default Diagnostics
