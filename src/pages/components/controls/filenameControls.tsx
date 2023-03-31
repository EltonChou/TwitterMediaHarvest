import { DEFAULT_DIRECTORY } from '@backend/constants'
import { Checkbox, FormControl, Input } from '@chakra-ui/react'
import React, { memo, useCallback, useState } from 'react'
import browser from 'webextension-polyfill'

export const SubDirectoryControl = memo(
  ({ directory, hasSub, isValidDir, handleCheckBox, handleInput }: SubDirectoryControlProps) => {
    const [isDirChanged, setDirIsChanged] = useState(false)

    const handleDirInput = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setDirIsChanged(true)
        handleInput(event.target.value)
      },
      [handleInput]
    )

    return (
      <FormControl>
        <Checkbox isChecked={!hasSub} onChange={handleCheckBox}>
          {browser.i18n.getMessage('noSubDirectory')}
        </Checkbox>
        <Input
          placeholder={DEFAULT_DIRECTORY}
          isDisabled={!hasSub}
          focusBorderColor={isDirChanged ? (isValidDir ? 'green.300' : 'red.300') : 'blue.300'}
          value={directory}
          onInput={handleDirInput}
          onChange={handleDirInput}
          isInvalid={!isValidDir}
        />
      </FormControl>
    )
  }
)

type SubDirectoryControlProps = {
  directory: string
  hasSub: boolean
  isValidDir: boolean
  handleInput: (v: string) => void
  handleCheckBox: () => void
}
