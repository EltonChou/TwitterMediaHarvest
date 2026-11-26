/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ISettingsVORepository } from '#domain/repositories/settings'
import { FilenameSetting } from '#domain/valueObjects/filenameSetting'
import type { AggregationToken } from '#domain/valueObjects/filenameSetting'
import type PatternToken from '#enums/patternToken'
import { getText as i18n } from '#libs/i18n'
import type { HelperMessage } from '#pages/components/controls/featureControls'
import { createSettingsStore } from '#pages/stores/SettingsStore'
import type { PayloadAction, PureAction } from '#pages/types/reducerAction'
import {
  useCallback,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
} from 'react'

type DirectorySetAction = PayloadAction<'setDirectory', string>

type FilenamePatternSetAction = PayloadAction<
  'setFilenamePattern',
  PatternToken[]
>

type AggregationTokenSetAction = PayloadAction<
  'setAggregationToken',
  AggregationToken
>

type FilenameSettingsPureAction = PureAction<
  'toggleDirectory' | 'toggleFileAggregation'
>

type FilenameSettingsAction =
  | FilenameSettingsPureAction
  | PayloadAction<'reset', FilenameSetting>
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
>

type EditStatus = {
  dataIsChanged: boolean
  directoryIsValid: boolean
  filenamePatternIsValid: boolean
}

type FormStatus = EditStatus & {
  isLoaded: boolean
}

const defaultEditStatus: EditStatus = {
  dataIsChanged: false,
  directoryIsValid: true,
  filenamePatternIsValid: true,
}

function formStatusReducer(
  formStatus: EditStatus,
  action: FormStatusAction
): EditStatus {
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
      return new FilenameSetting({
        ...settingProps,
        filenamePattern: action.payload,
      })

    case 'setAggregationToken':
      return new FilenameSetting({ ...settingProps, groupBy: action.payload })

    case 'reset':
      return action.payload
  }
}

const isValidFormStatus = (status: EditStatus) =>
  status.directoryIsValid && status.filenamePatternIsValid

type FormMessage = {
  directory: HelperMessage | undefined
  filenamePattern: HelperMessage | undefined
}

type PatternTokenState = 'enable' | 'disable'

type FormHandler = {
  submit: () => Promise<void>
  reset: () => void
  setDirectory: (directory: string) => void
  toggleSubDirectory: () => void
  changePatternTokenState: (
    state: PatternTokenState
  ) => (token: PatternToken) => void
  /**
   * - If `sourceIndex` is out of range, do nothing.
   * - If *`destinationIndex < 0`*, the source element will be inserted into the begining of array.
   * - If *`desitnationIndex > maximum index`*, the source element will be appended to the end of array.
   *
   * @param sourceIndex source index in pattern array.
   * @param destinationIndex destination index in pattern array.
   */
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
  const store = useMemo(
    () =>
      createSettingsStore({
        get: () => filenameSettingsRepo.get(),
        getDefault: () => filenameSettingsRepo.getDefault(),
        keys: new Set(
          filenameSettingsRepo.getDefault().mapBy(props => Object.keys(props))
        ),
      }),
    [filenameSettingsRepo]
  )
  const storedSettings = useSyncExternalStore(
    store.subscribe,
    store.getSnapShot
  )
  const isLoaded = useSyncExternalStore(store.subscribe, store.getIsLoaded)
  // Unsaved edits. While it exists, it wins over the stored settings,
  // so a late load or a change from elsewhere cannot clobber the user's edits.
  const [draft, setDraft] = useState<FilenameSetting | null>(null)
  const filenameSettings = draft ?? storedSettings

  const settingsDispatch = useCallback(
    (action: FilenameSettingsAction) =>
      setDraft(draft => settingReducer(draft ?? storedSettings, action)),
    [storedSettings]
  )

  const [formStatus, formStatusDispatch] = useReducer(
    formStatusReducer,
    defaultEditStatus
  )
  const [directoryMessage, setDirectoryMessage] = useState<
    undefined | HelperMessage
  >(undefined)
  const [patternMessage, setPatternMessage] = useState<
    undefined | HelperMessage
  >(undefined)

  const submit = useCallback(async () => {
    if (
      !isValidFormStatus(formStatus) ||
      filenameSettings.validate() !== undefined
    )
      return
    await filenameSettingsRepo.save(filenameSettings)
    // Reload before dropping the draft so the saved value is shown right away.
    await store.triggerChange()
    setDraft(null)
    formStatusDispatch({ type: 'formIsNotChanged' })
  }, [filenameSettingsRepo, filenameSettings, formStatus, store])

  const reset = useCallback(() => {
    settingsDispatch({
      type: 'reset',
      payload: filenameSettingsRepo.getDefault(),
    })
    formStatusDispatch({ type: 'formIsChanged' })
  }, [filenameSettingsRepo, settingsDispatch])

  const setDirectory = useCallback(
    (directory: string) => {
      const invalidDirectoryReason =
        FilenameSetting.validateDirectory(directory)
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
              content: i18n(
                'Invalid directory name. Cannot contain <>:"\\|?*',
                'options:general'
              ),
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
        type: isPatternValid
          ? 'filenamePatternIsValid'
          : 'filenamePatternIsInvalid',
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
              content: i18n(
                'Invalid pattern. The pattern must include `Tweet ID` + `Serial` or `Hash`.',
                'options:general'
              ),
            }
      )

      formStatusDispatch({ type: 'formIsChanged' })
    },
    [filenameSettings, settingsDispatch]
  )
  /**
   * @see {@link FormHandler#sortPatternToken} for implementation details
   */
  const sortPatternToken = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      const newPattern = [
        ...filenameSettings.mapBy(props => props.filenamePattern),
      ]
      const [target] = newPattern.splice(sourceIndex, 1)
      if (target === undefined) return

      newPattern.splice(Math.max(0, destinationIndex), 0, target)
      formStatusDispatch({ type: 'formIsChanged' })
      settingsDispatch({
        type: 'setFilenamePattern',
        payload: newPattern,
      })
    },
    [filenameSettings, settingsDispatch]
  )

  const setAggregationToken = useCallback(
    (aggregationToken: AggregationToken) => {
      settingsDispatch({
        type: 'setAggregationToken',
        payload: aggregationToken,
      })
      formStatusDispatch({ type: 'formIsChanged' })
    },
    [settingsDispatch]
  )

  const toggleAggregationToken = useCallback(() => {
    settingsDispatch({
      type: 'toggleFileAggregation',
    })
    formStatusDispatch({ type: 'formIsChanged' })
  }, [settingsDispatch])

  return {
    filenameSetting: filenameSettings,
    status: { ...formStatus, isLoaded },
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
