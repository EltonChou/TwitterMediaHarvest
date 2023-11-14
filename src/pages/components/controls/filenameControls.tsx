import { DragHandleIcon } from '@chakra-ui/icons'
import { Box, Tag, TagCloseButton, TagLabel, TagLeftIcon } from '@chakra-ui/react'
import type { DraggableProvided } from '@hello-pangea/dnd'
import React, { memo } from 'react'

type PatternTokenProps = {
  tokenName: string
  isOn: boolean
  handleChange?: (state: boolean) => void
}

export const PatternToken = memo(
  ({ tokenName, isOn, handleChange }: PatternTokenProps) => (
    <Box
      pl={'1em'}
      pr={'1em'}
      fontSize={'1em'}
      fontWeight={'medium'}
      color={'gray.900'}
      borderRadius={'full'}
      bg={isOn ? 'token.active' : 'white'}
      cursor="pointer"
      onClick={() => handleChange(!isOn)}
    >
      {tokenName}
    </Box>
  )
)

type SortablePatternTokenProps = {
  tokenName: string
  innerRef: (element?: HTMLElement) => void
  isDragging: boolean
  draggableProvided: DraggableProvided
  handleChange?: (state: boolean) => void
}

export const SortablePatternToken = memo(
  ({
    tokenName,
    innerRef,
    isDragging,
    draggableProvided,
    handleChange,
  }: SortablePatternTokenProps) => (
    <Tag
      {...draggableProvided.draggableProps}
      {...draggableProvided.dragHandleProps}
      style={{ ...draggableProvided.draggableProps.style }}
      ref={innerRef}
      size="md"
      fontSize="1em"
      fontWeight="medium"
      borderRadius="full"
      color="gray.900"
      bg="white"
      opacity={isDragging ? 0.7 : 1}
      userSelect="none"
    >
      <TagLeftIcon as={DragHandleIcon} boxSize={3} color={'gray.600'} />
      <TagLabel>{tokenName}</TagLabel>
      <TagCloseButton onClick={() => handleChange(false)} />
    </Tag>
  )
)
