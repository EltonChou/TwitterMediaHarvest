import { getText as i18n } from '#libs/i18n'
import {
  ExtensionStatus,
  WorkflowStatus,
  useExtensionConflictDiagnostics,
} from '#pages/hooks/useExtensionConflictDiagnostics'
import { getRuntimeId } from '#utils/runtime'
import { Button, HStack, Heading, Icon, Stack, Text } from '@chakra-ui/react'
import React from 'react'
import { FaCheck, FaQuestion, FaXmark } from 'react-icons/fa6'

const ExtensionStatusIcon = ({ status }: { status: ExtensionStatus }) => {
  switch (status) {
    case ExtensionStatus.COMPATIBLE:
      return <Icon as={FaCheck} color={'brand.green'} />
    case ExtensionStatus.CONFLICTED:
      return <Icon as={FaXmark} color={'brand.red'} />
    default:
      return <Icon as={FaQuestion} color={'gray.500'} />
  }
}

type DiagnosticItemProps = {
  name: string
}

const DiagnosticItem = (props: DiagnosticItemProps) => {
  const {
    installed,
    status,
    message,
    disableConflicted,
    requestDiagnose,
    abort,
  } = useExtensionConflictDiagnostics([getRuntimeId()])

  return (
    <Stack p={'1.5rem'} spacing={2}>
      <Heading size="md">{props.name}</Heading>
      <Text>
        {i18n(
          'This diagnostic will check your installed extensions that might conflict with this extension.',
          'options:diagnostics'
        )}
      </Text>
      <Text>{message}</Text>
      <HStack>
        {status === WorkflowStatus.RUNNING ? (
          <Button onClick={abort}>Abort</Button>
        ) : (
          <Button
            onClick={async () => {
              if (
                !confirm(
                  i18n(
                    'Are you sure to start diagnostics?',
                    'options:diagnostics'
                  ) +
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
                )
              )
                return

              await requestDiagnose()
            }}
          >
            Diagnostic
          </Button>
        )}
        <Button
          onClick={disableConflicted}
          isDisabled={status !== WorkflowStatus.COMPLETED}
        >
          Disable
        </Button>
      </HStack>
      <Stack>
        {Object.entries(installed).map(([id, info]) => (
          <HStack key={id}>
            <ExtensionStatusIcon status={info.status} />
            <p>{info.name}</p>
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
