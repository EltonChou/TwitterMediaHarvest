import type { IWarningSettingsRepo } from '#domain/repositories/warningSettings'
import type { InitPayloadAction, PureAction } from '#pages/types/reducerAction'
import type { WarningSettings } from '#schema'
import { useEffect, useReducer } from 'react'

function reducer(
  settings: WarningSettings,
  action:
    | PureAction<'toggleFilenameIgnoring'>
    | InitPayloadAction<WarningSettings>
): WarningSettings {
  switch (action.type) {
    case 'toggleFilenameIgnoring':
      return {
        ...settings,
        ignoreFilenameOverwritten: !settings.ignoreFilenameOverwritten,
      }
    case 'init':
      return action.payload
  }
}

type Toggler = Record<keyof WarningSettings, () => Promise<void>>

const useWarningSettings = (
  warningSettingsRepo: IWarningSettingsRepo
): {
  settings: WarningSettings
  toggler: Toggler
} => {
  const [warningSettings, dispatchWarningSettings] = useReducer(
    reducer,
    warningSettingsRepo.getDefault()
  )

  useEffect(() => {
    warningSettingsRepo.get().then(settings => {
      dispatchWarningSettings({ type: 'init', payload: settings })
    })
  }, [warningSettingsRepo])

  const toggleFilenameIgnoring = async () => {
    await warningSettingsRepo.save({
      ignoreFilenameOverwritten: !warningSettings.ignoreFilenameOverwritten,
    })
    dispatchWarningSettings({ type: 'toggleFilenameIgnoring' })
  }

  return {
    settings: warningSettings,
    toggler: {
      ignoreFilenameOverwritten: toggleFilenameIgnoring,
    },
  }
}

export default useWarningSettings
