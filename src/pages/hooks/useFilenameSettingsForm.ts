import { storageConfig } from '@backend/configurations'
import type { HelperMessage } from '@pages/components/controls/featureControls'
import { i18n } from '@pages/utils'
import type { AggregationToken, FilenamePatternToken, V4FilenamePattern, V4FilenameSettings } from '@schema'
import { useCallback, useEffect, useReducer, useState } from 'react'
import sanitize from 'sanitize-filename'

type DirectorySetAction = DataActionWithPayload<'setDirectory', string>

type FilenamePatternSetAction = DataActionWithPayload<'setFilenamePattern', V4FilenamePattern>

type AggregationTokenSetAction = DataActionWithPayload<'setAggregationToken', AggregationToken>

type FilenameSettingsPureAction = PureAction<'toggleDirectory' | 'reset' | 'toggleFileAggregation'>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | DataInitAction<V4FilenameSettings>
  | DirectorySetAction
  | FilenamePatternSetAction
  | AggregationTokenSetAction

type FormStatusAction =
  | 'directoryIsInvalid'
  | 'directoryIsValid'
  | 'filenamePatternIsInvalid'
  | 'filenamePatternIsValid'
  | 'formIsChanged'
  | 'formIsNotChanged'
  | 'init'

type FormStatus = {
  dataIsChanged: boolean
  directoryIsValid: boolean
  filenamePatternIsValid: boolean
  isLoaded: boolean
}

const defaultFormStatus: FormStatus = {
  dataIsChanged: false,
  directoryIsValid: true,
  filenamePatternIsValid: true,
  isLoaded: false,
}

const defaultFilenameSettings = storageConfig.v4FilenameSettingsRepo.getDefaultSettings()

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

    case 'init':
      return {
        ...formStatus,
        isLoaded: true,
      }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

function settingReducer(settings: V4FilenameSettings, action: FilenameSettingsAction): V4FilenameSettings {
  switch (action.type) {
    case 'toggleDirectory':
      return { ...settings, noSubDirectory: !settings.noSubDirectory }

    case 'toggleFileAggregation':
      return { ...settings, fileAggregation: !settings.fileAggregation }

    case 'setDirectory':
      return { ...settings, directory: action.payload }

    case 'setFilenamePattern':
      return { ...settings, filenamePattern: action.payload }

    case 'setAggregationToken':
      return { ...settings, groupBy: action.payload }

    case 'init':
      return action.payload

    case 'reset':
      return defaultFilenameSettings

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}

const dirNameRegEx = /^[^<>:"/\\|?*]+$/
const validDir = (dir: string) =>
  dir.split('/').every(dir => sanitize(dir) === dir && dirNameRegEx.test(dir)) && dir.length <= 512

const validPattern = (p: V4FilenamePattern) =>
  p.includes('{hash}') || (p.includes('{tweetId}') && p.includes('{serial}'))

type FormMessage = {
  directory: HelperMessage | null
  filenamePattern: HelperMessage | null
}

type FormHandler = {
  submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  reset: () => void
  directoryInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  directorySwitch: () => void
  patternTokenToggle: (t: FilenamePatternToken, s: boolean) => void
  handleAggregationTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  aggregationToggle: () => void
}

const useFilenameSettingsForm = (): [V4FilenameSettings, FormStatus, FormMessage, FormHandler] => {
  const [filenameSettings, settingsDispatch] = useReducer(settingReducer, defaultFilenameSettings)
  const [formStatus, formStatusDispatch] = useReducer(formStatusReducer, defaultFormStatus)
  const [directoryMessage, setDirectoryMessage] = useState<null | HelperMessage>(null)
  const [patternMessage, setPatternMessage] = useState<null | HelperMessage>(null)

  useEffect(() => {
    storageConfig.v4FilenameSettingsRepo.getSettings().then(settings => {
      settingsDispatch({ type: 'init', payload: settings })
      formStatusDispatch('init')
    })
  }, [])

  useEffect(() => {
    const isDirectoryValid = validDir(filenameSettings.directory)
    const isPatternValid = validPattern(filenameSettings.filenamePattern)
    formStatusDispatch(isDirectoryValid ? 'directoryIsValid' : 'directoryIsInvalid')
    formStatusDispatch(isPatternValid ? 'filenamePatternIsValid' : 'filenamePatternIsInvalid')
    setDirectoryMessage(
      isDirectoryValid ? null : { type: 'error', content: i18n('options_general_filenameSettings_message_dir') }
    )
    setPatternMessage(
      isPatternValid ? null : { type: 'error', content: i18n('options_general_filenameSettings_message_pattern') }
    )
  }, [filenameSettings])

  const submit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault()
      await storageConfig.v4FilenameSettingsRepo.saveSettings(filenameSettings)
      formStatusDispatch('formIsNotChanged')
    },
    [filenameSettings]
  )

  const reset = useCallback(() => {
    settingsDispatch({ type: 'reset' })
    formStatusDispatch('formIsChanged')
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

  const handleTokenToggle = useCallback(
    (t: FilenamePatternToken, state: boolean) => {
      const newPattern = state
        ? [...filenameSettings.filenamePattern, t]
        : [...filenameSettings.filenamePattern].filter(v => v !== t)

      formStatusDispatch('formIsChanged')
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
    },
    [filenameSettings]
  )

  const handleAggregationTokenChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    settingsDispatch({
      type: 'setAggregationToken',
      payload: e.target.value as AggregationToken,
    })
    formStatusDispatch('formIsChanged')
  }, [])

  const handleAggregationToggle = useCallback(() => {
    settingsDispatch({
      type: 'toggleFileAggregation',
    })
    formStatusDispatch('formIsChanged')
  }, [])

  return [
    filenameSettings,
    formStatus,
    { directory: directoryMessage, filenamePattern: patternMessage },
    {
      submit: submit,
      reset: reset,
      directoryInput: handleInput,
      directorySwitch: handleSubDirectoryClick,
      patternTokenToggle: handleTokenToggle,
      handleAggregationTokenChange: handleAggregationTokenChange,
      aggregationToggle: handleAggregationToggle,
    },
  ]
}

export default useFilenameSettingsForm
