import { DragHandleIcon } from '@chakra-ui/icons'
import { Box, HStack, Tag, TagCloseButton } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
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
      userSelect={'none'}
    >
      {tokenName}
    </Box>
  )
)

type SortablePatternTokenProps = {
  token: string
  name: string
  handleRemove: () => void
}

export const SortablePatternToken = memo(
  ({ token, name, handleRemove }: SortablePatternTokenProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: token,
    })

    const isDragging = attributes['aria-pressed']

    return (
      <Tag
        ref={setNodeRef}
        {...attributes}
        size="md"
        transition={transition}
        fontSize="1em"
        fontWeight="medium"
        borderRadius="full"
        color="gray.900"
        bg="white"
        userSelect="none"
        transform={
          transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
        }
        cursor={isDragging ? 'grabbing' : 'grab'}
        opacity={isDragging ? 0.65 : 1}
        zIndex={isDragging ? 1 : 0}
      >
        <HStack spacing={2} {...listeners}>
          <DragHandleIcon boxSize={3} color={'gray.600'} />
          <>{name}</>
        </HStack>
        <TagCloseButton onClick={handleRemove} />
      </Tag>
    )
  }
)
