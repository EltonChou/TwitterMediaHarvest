import { storageConfig } from '@backend/configurations'
import { Button, FormLabel, Stack } from '@chakra-ui/react'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import sanitize from 'sanitize-filename'
import { SubDirectoryControl } from './controls/filenameControls'

const defaultFilenameSettings = storageConfig.v4FilenameSettingsRepo.getDefaultSettings()

function settingReducer(settings: V4FilenameSettings, action: FilenameSettingsAction): V4FilenameSettings {
  switch (action.type) {
    case 'toggleDirectory':
      return { ...settings, noSubDirectory: !settings.noSubDirectory }

    case 'setDirectory':
      return { ...settings, directory: action.payload }

    case 'setFilenamePattern':
      return { ...settings, filenamePattern: action.payload }

    case 'init':
      return action.payload

    case 'reset':
      return defaultFilenameSettings

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

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

const FilenameControlBlock = () => {
  const [formStatus, formStatusDispatch] = useReducer(formStatusReducer, defaultFormStatus)
  const [filenameSettings, settingsDispatch] = useReducer(settingReducer, defaultFilenameSettings)
  const [isSubmitable, setSubmitable] = useState(false)

  useEffect(() => {
    storageConfig.v4FilenameSettingsRepo.getSettings().then(settings => {
      settingsDispatch({ type: 'init', payload: settings })
    })
  }, [])

  useEffect(() => {
    setSubmitable(Object.values(formStatus).every(v => v))
  }, [formStatus])

  useEffect(() => {
    formStatusDispatch(validDir(filenameSettings.directory) ? 'directoryIsValid' : 'directoryIsInvalid')
    formStatusDispatch(
      validPattern(filenameSettings.filenamePattern) ? 'filenamePatternIsValid' : 'filenamePatternIsInvalid'
    )
  }, [filenameSettings])

  const submit = useCallback(() => {
    alert(JSON.stringify(filenameSettings))
    formStatusDispatch('formIsNotChanged')
  }, [filenameSettings])

  const reset = useCallback(() => {
    settingsDispatch({ type: 'init', payload: defaultFilenameSettings })
    formStatusDispatch('formIsNotChanged')
  }, [])

  const handleInput = useCallback((value: string) => {
    settingsDispatch({ type: 'setDirectory', payload: value })
    formStatusDispatch('formIsChanged')
  }, [])

  const handleCheckBox = useCallback(() => {
    formStatusDispatch('formIsChanged')
    settingsDispatch({ type: 'toggleDirectory' })
  }, [])

  return (
    <div>
      <SubDirectoryControl
        isValidDir={formStatus.directoryIsValid}
        directory={filenameSettings.directory}
        hasSub={!filenameSettings.noSubDirectory}
        handleCheckBox={handleCheckBox}
        handleInput={handleInput}
      />
      <Stack spacing={4} direction="row" align="center">
        <Button colorScheme="teal" isDisabled={!isSubmitable} onClick={submit}>
          Save
        </Button>
        <Button colorScheme="red" variant="link" onClick={reset}>
          Reset
        </Button>
      </Stack>
    </div>
  )
}

export default FilenameControlBlock

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

type DirectorySetAction = {
  type: 'setDirectory'
} & DataActionWithPayload<string>

type FilenamePatternSetAction = {
  type: 'setFilenamePattern'
} & DataActionWithPayload<V4FilenamePattern>

type FilenameSettingsPureAction = PureAction<'toggleDirectory' | 'reset'>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | DataInitAction<V4FilenameSettings>
  | DirectorySetAction
  | FilenamePatternSetAction
