import type { ISettingsVORepository } from '#domain/repositories/settings'
import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import type { AggregationToken } from '#domain/valueObjects/filenameSetting'
import type PatternToken from '#enums/patternToken'
import type { HelperMessage } from '#pages/components/controls/featureControls'
import type {
  InitPayloadAction,
  PayloadAction,
  PureAction,
} from '#pages/typings/reducerAction'
import { i18n } from '#pages/utils'
import { useCallback, useEffect, useReducer, useState } from 'react'

type DirectorySetAction = PayloadAction<'setDirectory', string>

type FilenamePatternSetAction = PayloadAction<'setFilenamePattern', PatternToken[]>

type AggregationTokenSetAction = PayloadAction<'setAggregationToken', AggregationToken>

type FilenameSettingsPureAction = PureAction<'toggleDirectory' | 'toggleFileAggregation'>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | PayloadAction<'reset', FilenameSetting>
  | InitPayloadAction<FilenameSetting>
  | DirectorySetAction
  | FilenamePatternSetAction
  | AggregationTokenSetAction

type FormStatusAction = PureAction<
  | 'directoryIsInvalid'
  | 'directoryIsValid'
  | 'filenamePatternIsInvalid'
  | 'filenamePatternIsValid'
  | 'formIsChanged'
  | 'formIsNotChanged'
  | 'init'
>

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

function formStatusReducer(formStatus: FormStatus, action: FormStatusAction): FormStatus {
  switch (action.type) {
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
      return action.payload
  }
}

const isValidFormStatus = (status: FormStatus) =>
  status.directoryIsValid && status.filenamePatternIsValid

type FormMessage = {
  directory: HelperMessage | undefined
  filenamePattern: HelperMessage | undefined
}

type PatternTokenState = 'enable' | 'disable'

type FormHandler = {
  submit: () => void
  reset: () => void
  setDirectory: (directory: string) => void
  toggleSubDirectory: () => void
  changePatternTokenState: (state: PatternTokenState) => (token: PatternToken) => void
  sortPatternToken: (sourceIndex: number, destinationIndex: number) => void
  setAggregationToken: (aggregationToken: AggregationToken) => void
  toggleAggregationToken: () => void
}

const useFilenameSettingsForm = (
  filenameSettingsRepo: ISettingsVORepository<FilenameSetting>
): {
  filenameSetting: FilenameSetting
  status: FormStatus
  message: FormMessage
  handler: FormHandler
} => {
  const [filenameSettings, settingsDispatch] = useReducer(
    settingReducer,
    filenameSettingsRepo.getDefault()
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
      formStatusDispatch({ type: 'init' })
    })
  }, [filenameSettingsRepo])

  const submit = useCallback(() => {
    if (!isValidFormStatus(formStatus) || filenameSettings.validate() !== undefined)
      return
    filenameSettingsRepo
      .save(filenameSettings)
      .then(() => formStatusDispatch({ type: 'formIsNotChanged' }))
  }, [filenameSettingsRepo, filenameSettings, formStatus])

  const reset = useCallback(() => {
    settingsDispatch({ type: 'reset', payload: filenameSettingsRepo.getDefault() })
    formStatusDispatch({ type: 'formIsChanged' })
  }, [settingsDispatch, filenameSettingsRepo])

  const setDirectory = useCallback(
    (directory: string) => {
      const invalidDirectoryReason = FilenameSetting.validateDirectory(directory)
      const isValidDirectory = invalidDirectoryReason === undefined
      formStatusDispatch({ type: 'formIsChanged' })
      formStatusDispatch({
        type: isValidDirectory ? 'directoryIsValid' : 'directoryIsInvalid',
      })
      setDirectoryMessage(
        isValidDirectory
          ? undefined
          : {
              type: 'error',
              content: i18n('options_general_filenameSettings_message_dir'),
            }
      )
      settingsDispatch({ type: 'setDirectory', payload: directory })
    },
    [settingsDispatch]
  )

  const toggleSubDirectory = useCallback(() => {
    formStatusDispatch({ type: 'formIsChanged' })
    settingsDispatch({ type: 'toggleDirectory' })
  }, [settingsDispatch])

  const changePatternTokenState = useCallback(
    (state: PatternTokenState) => (token: PatternToken) => {
      const pattern = filenameSettings.mapBy(props => props.filenamePattern)
      const newPattern =
        state === 'enable'
          ? pattern.includes(token)
            ? pattern
            : pattern.concat([token])
          : pattern.filter(v => v !== token)

      const invalidReason = FilenameSetting.validateFilenamePattern(newPattern)
      const isPatternValid = invalidReason === undefined

      formStatusDispatch({
        type: isPatternValid ? 'filenamePatternIsValid' : 'filenamePatternIsInvalid',
      })
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
      setPatternMessage(
        isPatternValid
          ? undefined
          : {
              type: 'error',
              content: i18n('options_general_filenameSettings_message_pattern'),
            }
      )

      formStatusDispatch({ type: 'formIsChanged' })
    },
    [filenameSettings]
  )

  const sortPatternToken = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const newPattern = [...filenameSettings.mapBy(props => props.filenamePattern)]
      if (sourceIndex < 0 || sourceIndex >= newPattern.length) return
      if (destinationIndex < 0 || destinationIndex >= newPattern.length) return

      const [removed] = newPattern.splice(sourceIndex, 1)
      newPattern.splice(destinationIndex, 0, removed)
      formStatusDispatch({ type: 'formIsChanged' })
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
    },
    [filenameSettings]
  )

  const setAggregationToken = useCallback((aggregationToken: AggregationToken) => {
    settingsDispatch({
      type: 'setAggregationToken',
      payload: aggregationToken,
    })
    formStatusDispatch({ type: 'formIsChanged' })
  }, [])

  const toggleAggregationToken = useCallback(() => {
    settingsDispatch({
      type: 'toggleFileAggregation',
    })
    formStatusDispatch({ type: 'formIsChanged' })
  }, [])

  return {
    filenameSetting: filenameSettings,
    status: formStatus,
    message: { directory: directoryMessage, filenamePattern: patternMessage },
    handler: {
      submit,
      reset,
      setDirectory,
      toggleSubDirectory,
      changePatternTokenState,
      sortPatternToken,
      setAggregationToken,
      toggleAggregationToken,
    },
  }
}

export default useFilenameSettingsForm
