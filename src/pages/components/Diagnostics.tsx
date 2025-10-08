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
  const { installed, status, message, disableConflicted, requestDiagnose } =
    useExtensionConflictDiagnostics([getRuntimeId()])

  return (
    <Stack p={'1.5rem'} spacing={2}>
      <Heading size="md">{props.name}</Heading>
      <Text>{message}</Text>
      <HStack>
        <Button
          onClick={requestDiagnose}
          isDisabled={status === WorkflowStatus.RUNNING}
        >
          Diagnostic
        </Button>
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
      <DiagnosticItem name="Conflict extensions" />
    </Stack>
  )
}

export default Diagnostics
