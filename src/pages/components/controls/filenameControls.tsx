/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { TestableComponent } from '#pages/types/props'
import { DragHandleIcon } from '@chakra-ui/icons'
import { Box, HStack, Tag, TagCloseButton } from '@chakra-ui/react'
import { useSortable } from '@dnd-kit/sortable'
import React, { memo } from 'react'

type PatternTokenProps = {
  tokenName: string
  isOn: boolean
  handleChange: (state: boolean) => void
} & TestableComponent

export const PatternToken = memo(
  ({ tokenName, isOn, handleChange, testId }: PatternTokenProps) => (
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
      data-testid={testId}
    >
      {tokenName}
    </Box>
  )
)

type SortablePatternTokenProps = {
  token: string
  name: string
  handleRemove: () => void
} & TestableComponent

export const SortablePatternToken = memo(
  ({ token, name, handleRemove, testId }: SortablePatternTokenProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: token,
    })

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
          transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined
        }
        cursor={isDragging ? 'grabbing' : 'grab'}
        opacity={isDragging ? 0.65 : 1}
        zIndex={isDragging ? 1 : 0}
        data-testid={testId}
      >
        <HStack spacing={2} {...listeners}>
          <DragHandleIcon
            boxSize={3}
            color={'gray.600'}
            data-testid={testId + '-handle'}
          />
          <>{name}</>
        </HStack>
        <TagCloseButton
          onClick={handleRemove}
          data-testid={testId + '-close'}
        />
      </Tag>
    )
  }
)
