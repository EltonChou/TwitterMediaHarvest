import type { ISettingsRepository } from '#domain/repositories/settings'
import { isFirefox } from '#helpers/runtime'
import type { InitPayloadAction, PureAction } from '#pages/types/reducerAction'
import type { DownloadSettings } from '#schema'
import { useEffect, useReducer } from 'react'

function reducer(
  settings: DownloadSettings,
  action:
    | PureAction<'toggleAria2' | 'toggleAggressive' | 'toggleAskWhere'>
    | InitPayloadAction<DownloadSettings>
): DownloadSettings {
  switch (action.type) {
    case 'toggleAggressive':
      return { ...settings, aggressiveMode: !settings.aggressiveMode }
    case 'toggleAria2':
      return { ...settings, enableAria2: !settings.enableAria2 }
    case 'toggleAskWhere':
      return { ...settings, askWhereToSave: !settings.askWhereToSave }
    case 'init':
      return action.payload
  }
}

type Toggler = Record<keyof DownloadSettings, () => Promise<void>>

const useDownloadSettings = (
  downloadSettingsRepo: ISettingsRepository<DownloadSettings>
): {
  settings: DownloadSettings
  toggler: Toggler
  canAskSaveLocation: boolean
} => {
  const [downloadSettings, dispatch] = useReducer(
    reducer,
    downloadSettingsRepo.getDefault()
  )

  useEffect(() => {
    downloadSettingsRepo.get().then(settings => {
      dispatch({
        type: 'init',
        payload: settings,
      })
    })
  }, [downloadSettingsRepo])

  const toggleAria2 = async () => {
    if (downloadSettings.enableAria2 === false) {
      /* TODO: Test aria2 connection */
    }
    await downloadSettingsRepo.save({
      enableAria2: !downloadSettings.enableAria2,
    })
    dispatch({ type: 'toggleAria2' })
  }

  const toggleAggressive = async () => {
    await downloadSettingsRepo.save({
      aggressiveMode: !downloadSettings.aggressiveMode,
    })
    dispatch({ type: 'toggleAggressive' })
  }

  const toggleAskWhereToSave = async () => {
    await downloadSettingsRepo.save({
      askWhereToSave: !downloadSettings.askWhereToSave,
    })
    dispatch({ type: 'toggleAskWhere' })
  }

  return {
    settings: downloadSettings,
    toggler: {
      enableAria2: toggleAria2,
      aggressiveMode: toggleAggressive,
      askWhereToSave: toggleAskWhereToSave,
    },
    canAskSaveLocation: isFirefox() && downloadSettings.enableAria2 === false,
  }
}

export default useDownloadSettings
