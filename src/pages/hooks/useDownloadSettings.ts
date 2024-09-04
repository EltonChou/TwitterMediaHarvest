import type { DownloadSettings } from '#schema'
import { downloadSettingsRepo } from '../../infraProvider'
import { useEffect, useReducer } from 'react'

function reducer(
  settings: DownloadSettings,
  action:
    | PureAction<'toggleAria2' | 'toggleAggressive' | 'toggleAskWhere'>
    | DataInitAction<DownloadSettings>
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
    default:
      throw new Error('Unknown action. ' + JSON.stringify(action))
  }
}

type Toggler = Record<keyof DownloadSettings, () => Promise<void>>

const useDownloadSettings = (): [DownloadSettings, Toggler] => {
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
  }, [])

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

  return [
    downloadSettings,
    {
      enableAria2: toggleAria2,
      aggressiveMode: toggleAggressive,
      askWhereToSave: toggleAskWhereToSave,
    },
  ]
}

export default useDownloadSettings
