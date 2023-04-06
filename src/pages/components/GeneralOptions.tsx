import { DEFAULT_DIRECTORY } from '@backend/constants'
import { Button, HStack, Input, Stack, VStack } from '@chakra-ui/react'
import useFilenameSettings from '@pages/hooks/useFilenameSettings'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import sanitize from 'sanitize-filename'
import { type HelperMessage, RichFeatureSwitch } from './controls/featureControls'

function formStatusReducer(formStatus: FormStatus, action: FormStatusAction): FormStatus {
  switch (action) {
    case 'directoryIsInvalid':
      return {
        ...formStatus,
        directoryIsValid: false,
      }

    case 'directoryIsValid':
      return {
        ...formStatus,
        directoryIsValid: true,
      }

    case 'filenamePatternIsInvalid':
      return {
        ...formStatus,
        filenamePatternIsValid: false,
      }

    case 'filenamePatternIsValid':
      return {
        ...formStatus,
        filenamePatternIsValid: true,
      }

    case 'formIsChanged':
      return {
        ...formStatus,
        dataIsChanged: true,
      }

    case 'formIsNotChanged':
      return {
        ...formStatus,
        dataIsChanged: false,
      }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

const dirNameRegEx = /^[^<>:"/\\|?*]+$/
const patternRegEx = /^({(?:account|tweetId|serial|hash|date)})+$/
const validDir = (dir: string) => sanitize(dir) === dir && dirNameRegEx.test(dir)
const validPattern = (n: V4FilenamePattern) => patternRegEx.test(n.join(''))

const GeneralOptions = () => {
  const [formStatus, formStatusDispatch] = useReducer(formStatusReducer, defaultFormStatus)
  const [filenameSettings, settingsDispatch] = useFilenameSettings()
  const [isSubmitable, setSubmitable] = useState(false)
  const [directoryMessage, setDirectoryMessage] = useState<null | HelperMessage>(null)

  useEffect(() => {
    setSubmitable(Object.values(formStatus).every(v => v))
    setDirectoryMessage(
      formStatus.directoryIsValid
        ? null
        : { type: 'error', content: 'Invalid directory name. Cannot contain <>:"/\\|?*' }
    )
  }, [formStatus])

  useEffect(() => {
    formStatusDispatch(validDir(filenameSettings.directory) ? 'directoryIsValid' : 'directoryIsInvalid')
    formStatusDispatch(
      validPattern(filenameSettings.filenamePattern) ? 'filenamePatternIsValid' : 'filenamePatternIsInvalid'
    )
  }, [filenameSettings])

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      alert(JSON.stringify(filenameSettings))
      formStatusDispatch('formIsNotChanged')
    },
    [filenameSettings]
  )

  const reset = useCallback(() => {
    settingsDispatch({ type: 'reset' })
    formStatusDispatch('formIsNotChanged')
  }, [settingsDispatch])

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      settingsDispatch({ type: 'setDirectory', payload: event.target.value })
      formStatusDispatch('formIsChanged')
    },
    [settingsDispatch]
  )

  const handleSubDirectoryClick = useCallback(() => {
    formStatusDispatch('formIsChanged')
    settingsDispatch({ type: 'toggleDirectory' })
  }, [settingsDispatch])

  const DirectoryInput = (
    <Input
      placeholder={DEFAULT_DIRECTORY}
      focusBorderColor={formStatus.dataIsChanged ? (formStatus.directoryIsValid ? 'green.300' : 'red.300') : 'blue.300'}
      value={filenameSettings.directory}
      onInput={handleInput}
      onChange={handleInput}
      isDisabled={filenameSettings.noSubDirectory}
      isInvalid={!formStatus.directoryIsValid}
    />
  )

  return (
    <form onReset={reset} onSubmit={submit}>
      <VStack>
        <HStack>
          <Button type="reset">Reset</Button>
          <Button type="submit" isDisabled={!isSubmitable}>
            Save
          </Button>
        </HStack>
        <RichFeatureSwitch name="Filename pattern" desc="Create sub-directory under the default download directory." />
        <RichFeatureSwitch
          name="Create sub-directory"
          message={directoryMessage}
          desc="Create sub-directory under the default download directory."
          isOn={!filenameSettings.noSubDirectory}
          handleClick={handleSubDirectoryClick}
          RichContent={DirectoryInput}
        />
      </VStack>
    </form>
  )
}

export default GeneralOptions

type FormStatusAction =
  | 'directoryIsInvalid'
  | 'directoryIsValid'
  | 'filenamePatternIsInvalid'
  | 'filenamePatternIsValid'
  | 'formIsChanged'
  | 'formIsNotChanged'

type FormStatus = {
  dataIsChanged: boolean
  directoryIsValid: boolean
  filenamePatternIsValid: boolean
}

const defaultFormStatus: FormStatus = {
  dataIsChanged: false,
  directoryIsValid: true,
  filenamePatternIsValid: true,
}
