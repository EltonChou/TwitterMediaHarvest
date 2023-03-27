import { Checkbox, CheckboxGroup, Input } from '@chakra-ui/react'
import { DEFAULT_DIRECTORY } from '@backend/constants'
import React, { useState } from 'react'
import browser from 'webextension-polyfill'

const SubDirectoryControl = () => {
  const [hasSubDir, setHasSubDir] = useState(true)
  return (
    <div>
      <Input placeholder={DEFAULT_DIRECTORY} isDisabled={!hasSubDir}></Input>
      <Checkbox checked={!hasSubDir} onChange={() => setHasSubDir(!hasSubDir)}>
        {browser.i18n.getMessage('noSubDirectory')}
      </Checkbox>
    </div>
  )
}

const FilenameControlForm = () => {
  return (
    <div>
      Filename Control
      <SubDirectoryControl />
    </div>
  )
}

export default FilenameControlForm
