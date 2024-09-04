import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import PatternToken from '#enums/patternToken'
import type { HelperMessage } from '#pages/components/controls/featureControls'
import { i18n } from '#pages/utils'
import type { AggregationToken } from '#schema'
import { filenameSettingsRepo } from '../../infraProvider'
import { useCallback, useEffect, useReducer, useState } from 'react'
import sanitize from 'sanitize-filename'

type DirectorySetAction = DataActionWithPayload<'setDirectory', string>

type FilenamePatternSetAction = DataActionWithPayload<
  'setFilenamePattern',
  PatternToken[]
>

type AggregationTokenSetAction = DataActionWithPayload<
  'setAggregationToken',
  AggregationToken
>

type FilenameSettingsPureAction = PureAction<
  'toggleDirectory' | 'reset' | 'toggleFileAggregation'
>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | DataInitAction<FilenameSetting>
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

const defaultFilenameSettings = filenameSettingsRepo.getDefault()

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

function settingReducer(
  settings: FilenameSetting,
  action: FilenameSettingsAction
): FilenameSetting {
  const settingProps = settings.mapBy(props => props)
  switch (action.type) {
    case 'toggleDirectory':
      return new FilenameSetting({
        ...settingProps,
        noSubDirectory: !settingProps.noSubDirectory,
      })

    case 'toggleFileAggregation':
      return new FilenameSetting({
        ...settingProps,
        fileAggregation: !settingProps.fileAggregation,
      })

    case 'setDirectory':
      return new FilenameSetting({ ...settingProps, directory: action.payload })

    case 'setFilenamePattern':
      return new FilenameSetting({ ...settingProps, filenamePattern: action.payload })

    case 'setAggregationToken':
      return new FilenameSetting({ ...settingProps, groupBy: action.payload })

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
  dir.split('/').every(dir => sanitize(dir) === dir && dirNameRegEx.test(dir)) &&
  dir.length <= 512

const validPattern = (p: PatternToken[]) =>
  p.includes(PatternToken.Hash) ||
  (p.includes(PatternToken.TweetId) && p.includes(PatternToken.Serial))

type FormMessage = {
  directory: HelperMessage | undefined
  filenamePattern: HelperMessage | undefined
}

type FormHandler = {
  submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  reset: () => void
  directoryInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  directorySwitch: () => void
  patternTokenToggle: (t: PatternToken, s: boolean) => void
  patternTokenSort: (sourceIndex: number, destinationIndex: number) => void
  handleAggregationTokenChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  aggregationToggle: () => void
}

const useFilenameSettingsForm = (): [
  FilenameSetting,
  FormStatus,
  FormMessage,
  FormHandler
] => {
  const [filenameSettings, settingsDispatch] = useReducer(
    settingReducer,
    defaultFilenameSettings
  )
  const [formStatus, formStatusDispatch] = useReducer(
    formStatusReducer,
    defaultFormStatus
  )
  const [directoryMessage, setDirectoryMessage] = useState<undefined | HelperMessage>(
    undefined
  )
  const [patternMessage, setPatternMessage] = useState<undefined | HelperMessage>(
    undefined
  )

  useEffect(() => {
    filenameSettingsRepo.get().then(settings => {
      settingsDispatch({ type: 'init', payload: settings })
      formStatusDispatch('init')
    })
  }, [])

  useEffect(() => {
    const isDirectoryValid = validDir(filenameSettings.mapBy(props => props.directory))
    const isPatternValid = validPattern(
      filenameSettings.mapBy(props => props.filenamePattern)
    )
    formStatusDispatch(isDirectoryValid ? 'directoryIsValid' : 'directoryIsInvalid')
    formStatusDispatch(
      isPatternValid ? 'filenamePatternIsValid' : 'filenamePatternIsInvalid'
    )
    setDirectoryMessage(
      isDirectoryValid
        ? undefined
        : { type: 'error', content: i18n('options_general_filenameSettings_message_dir') }
    )
    setPatternMessage(
      isPatternValid
        ? undefined
        : {
            type: 'error',
            content: i18n('options_general_filenameSettings_message_pattern'),
          }
    )
  }, [filenameSettings])

  const submit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) e.preventDefault()
      await filenameSettingsRepo.save(filenameSettings)
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
    (t: PatternToken, state: boolean) => {
      const newPattern = state
        ? [...filenameSettings.mapBy(props => props.filenamePattern), t]
        : [...filenameSettings.mapBy(props => props.filenamePattern)].filter(v => v !== t)

      formStatusDispatch('formIsChanged')
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
    },
    [filenameSettings]
  )

  const handleTokenSort = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const newPattern = [...filenameSettings.mapBy(props => props.filenamePattern)]
      const [removed] = newPattern.splice(sourceIndex, 1)
      newPattern.splice(destinationIndex, 0, removed)
      formStatusDispatch('formIsChanged')
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
    },
    [filenameSettings]
  )

  const handleAggregationTokenChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      settingsDispatch({
        type: 'setAggregationToken',
        payload: e.target.value as AggregationToken,
      })
      formStatusDispatch('formIsChanged')
    },
    []
  )

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
      patternTokenSort: handleTokenSort,
      handleAggregationTokenChange: handleAggregationTokenChange,
      aggregationToggle: handleAggregationToggle,
    },
  ]
}

export default useFilenameSettingsForm
