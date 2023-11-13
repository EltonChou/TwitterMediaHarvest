import { DragHandleIcon } from '@chakra-ui/icons'
import { Box, Center, Flex, useBoolean } from '@chakra-ui/react'
import type { DraggableProvided } from '@hello-pangea/dnd'
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

type SortablePatternTokenProps = {
  tokenName: string
  innerRef: (element?: HTMLElement) => void
  isDragging: boolean
  draggableProvided: DraggableProvided
}

export const SortablePatternToken = memo(
  ({ tokenName, innerRef, isDragging, draggableProvided }: SortablePatternTokenProps) => {
    return (
      <Flex
        {...draggableProvided.draggableProps}
        ref={innerRef}
        gap={0.5}
        paddingInline={'0.5em'}
        fontSize={'1em'}
        fontWeight={'medium'}
        color={'gray.900'}
        borderRadius={'full'}
        bg={'white'}
        opacity={isDragging ? 0.7 : 1}
      >
        <Center {...draggableProvided.dragHandleProps}>
          <DragHandleIcon boxSize={3} color={'gray.600'} />
        </Center>
        {tokenName}
      </Flex>
    )
  }
)
