import { getText as i18n } from '#libs/i18n'
import { metrics } from '@sentry/browser'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  Downloads,
  downloads,
  management,
  permissions,
  runtime,
} from 'webextension-polyfill'

export enum WorkflowStatus {
  INIT = 'INIT',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  ABORTED = 'ABORTED',
}

export enum ExtensionStatus {
  UNKNOWN = 'UNKNOWN',
  CONFLICTED = 'CONFLICTED',
  COMPATIBLE = 'COMPATIBLE',
}

export type ExtensionInfo = {
  name: string
  status: ExtensionStatus
  enabled: boolean
  icon?: string
}

export type ExtensionKV = {
  [id: string]: ExtensionInfo
}

export type DiagnosticsResult = {
  installed: ExtensionKV
  status: WorkflowStatus
  message: string
  requestDiagnose: () => Promise<void>
  disableConflicted: () => Promise<void>
  abort: () => void
}

type Action =
  | { type: 'SET_EXTENSIONS'; payload: ExtensionKV }
  | { type: 'CHANGE_STATUS'; payload: { id: string; status: ExtensionStatus } }
  | { type: 'DISABLE_EXTENSION'; payload: { id: string } }
  | { type: 'RESET' }

function reducer(state: ExtensionKV, action: Action): ExtensionKV {
  switch (action.type) {
    case 'SET_EXTENSIONS':
      return { ...action.payload }
    case 'CHANGE_STATUS': {
      const { id, status } = action.payload
      if (!state[id]) return state
      return {
        ...state,
        [id]: { ...state[id], status },
      }
    }
    case 'DISABLE_EXTENSION': {
      const { id } = action.payload
      if (!state[id]) return state
      const { [id]: _, ...rest } = state
      return rest
    }
    case 'RESET':
      return {}
    default:
      return state
  }
}

/**
 * This hookes provides diagnostics for extension conflicts by checking installed extensions.
 * It will test each enabled extension (except those in excludeIds) by attempting to download a test file.
 * If the download is interfered with (e.g., blocked or modified), the extension is marked as CONFLICTED.
 * *The hook uses the filename of the download item to identify which extension is being tested.*
 *
 * @param excludeIds List of extension IDs to exclude from diagnostics (e.g., self ID)
 * @returns
 */
export function useExtensionConflictDiagnostic(
  excludeIds: string[] = []
): DiagnosticsResult {
  /**
   * !IMPORTANT: *DO NOT USE `downloads.onDetermingFilename`*
   */
  const [enabledExts, dispatch] = useReducer(reducer, {})
  const [status, setStatus] = useState<WorkflowStatus>(WorkflowStatus.INIT)
  const [message, setMessage] = useState<string>('')
  const abortRef = useRef(false)

  const resetAbort = () => {
    abortRef.current = false
  }

  /**
   * Enable the extension to be tested, then start a download of a test file.
   * The download filename includes the extension ID to identify which extension is being tested.
   * The download listener will check if the download completes successfully or is interfered with.
   * After starting the download, the extension is disabled again to prepare for the next test.
   */
  const triggerCheckDownloadByExtId = useCallback(
    async (extId: string) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.debug(`Testing extension: ${extId}`)
      }
      const filename = extId + '.mhtest'

      let removeTestListener = () => {}
      const extStatus = await new Promise<ExtensionStatus>(
        (resolve, reject) => {
          const checkCompleteDownload: ListenerOf<
            Downloads.Static['onChanged']
          > = async downloadDelta => {
            if (downloadDelta.state?.current !== 'complete') return
            const [downloadItem] = await downloads.search({
              id: downloadDelta.id,
            })
            if (!downloadItem) return

            if (downloadItem.filename.includes(extId)) {
              resolve(ExtensionStatus.COMPATIBLE)
            } else {
              resolve(ExtensionStatus.CONFLICTED)
            }

            // Clean up downloaded test file.
            await downloads.removeFile(downloadItem.id)
            await downloads.erase({ id: downloadItem.id })
          }

          removeTestListener = () =>
            downloads.onChanged.removeListener(checkCompleteDownload)
          downloads.onChanged.addListener(checkCompleteDownload)

          downloads
            .download({
              filename: filename,
              url: runtime.getURL('static/TEST.data'),
              saveAs: false,
            })
            .then(dlId => {
              if (dlId) return
              const errorMsg =
                runtime.lastError?.message || 'Failed to start download.'
              setStatus(WorkflowStatus.ERROR)
              // eslint-disable-next-line no-console
              console.error('[diagnostic:conflict-extensions]', errorMsg)
              reject(new Error(errorMsg))
            })
        }
      )

      removeTestListener()
      // eslint-disable-next-line no-console
      console.info(
        extStatus === ExtensionStatus.COMPATIBLE
          ? '✅ Compatible extension:'
          : '❌ Conflicted extension:',
        extId in enabledExts ? `${enabledExts[extId].name} (${extId})` : extId
      )
      dispatch({
        type: 'CHANGE_STATUS',
        payload: {
          id: extId,
          status: extStatus,
        },
      })

      return extStatus === ExtensionStatus.CONFLICTED
    },
    [enabledExts]
  )

  useEffect(() => {
    // Always remove unused permission on unmount.
    return () => {
      permissions.remove({ permissions: ['management'] })
    }
  }, [])

  /**
   * Grant management permission and start diagnostics.
   * If permission is denied, the process will abort.
   * The diagnostics process involves:
   * 1. Disabling all target extensions.
   * 2. For each extension, enabling it and attempting to download a test file.
   * 3. Monitoring the download to see if it completes successfully or is interfered with.
   * 4. Marking the extension as COMPATIBLE or CONFLICTED based on the download result.
   * 5. Disabling the extension again before moving to the next one.
   * 6. Restoring all extensions to their original enabled/disabled state after completion.
   *
   * Note: This process may take some time depending on the number of extensions to check.
   */
  const requestDiagnose = useCallback(async () => {
    if (__METRICS__) metrics.count('diagnostics.extension_conflict.invoked', 1)

    resetAbort()
    setStatus(WorkflowStatus.RUNNING)
    setMessage(
      i18n(
        'Requesting management permission...',
        'hook:useExtensionConflictDiagnostic'
      )
    )

    // Once permission has been granted, browser will grant it implicitly in future without prompting.
    const granted = await permissions.request({ permissions: ['management'] })
    if (!granted) {
      setStatus(WorkflowStatus.ERROR)
      setMessage(
        i18n(
          'Required permission (management) was not granted.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
      return
    }

    const exts = await management.getAll()
    const filteredExt = exts
      // Filter out excluded extensions and self
      .filter(
        e =>
          e.type === 'extension' &&
          e.enabled === true &&
          !excludeIds.includes(e.id)
      )
      .reduce<ExtensionKV>(
        (extKV, ext) => ({
          ...extKV,
          [ext.id]: {
            name: ext.shortName || ext.name,
            version: ext.version,
            icon: ext.icons?.[0]?.url,
            status: ExtensionStatus.UNKNOWN,
            enabled: ext.enabled,
          },
        }),
        {}
      )

    /**
     * !IMPORTANT: Call this to restore original extension states when diagnostics complete.
     */
    const restoreExts = async () => {
      // eslint-disable-next-line no-console
      if (__DEV__) console.info('Restoring original extension states...')
      for (const [extId, ext] of Object.entries(filteredExt)) {
        await management.setEnabled(extId, ext.enabled)
      }
    }

    const extIdsToCheck = Object.keys(filteredExt)
    dispatch({ type: 'SET_EXTENSIONS', payload: filteredExt })

    // eslint-disable-next-line no-console
    console.group('Starting conflict diagnostic...')
    setMessage(
      i18n('Diagnostic is running...', 'hook:useExtensionConflictDiagnostic')
    )
    if (__DEV__) {
      /* eslint-disable no-console */
      console.info('Disabling all extensions before tests...')
      /* eslint-enable no-console */
    }
    await Promise.allSettled(
      extIdsToCheck.map(extId => management.setEnabled(extId, false))
    )

    let conflictedCount = 0
    for (const extId of extIdsToCheck) {
      if (abortRef.current) {
        /* eslint-disable no-console */
        if (__DEV__) console.info('Diagnostics aborted by user.')
        setMessage(
          i18n('Diagnostic is aborted.', 'hook:useExtensionConflictDiagnostic')
        )
        setStatus(WorkflowStatus.ABORTED)
        restoreExts()
        console.groupEnd()
        return
        /* eslint-enable no-console */
      }
      await management.setEnabled(extId, true)
      if (await triggerCheckDownloadByExtId(extId)) conflictedCount += 1
      await management.setEnabled(extId, false)
    }

    restoreExts()
    // eslint-disable-next-line no-console
    console.groupEnd()

    //TODO: Collect conflicted extensions information.

    // eslint-disable-next-line no-console
    console.info('Complete conflict diagnostics.')
    setStatus(WorkflowStatus.COMPLETED)
    setMessage(
      i18n('Scan completed. ', 'hook:useExtensionConflictDiagnostic') +
        (conflictedCount > 0
          ? i18n(
              '{{count}} conflicted extension(s) detected.',
              'hook:useExtensionConflictDiagnostic',
              { count: conflictedCount.toString() }
            )
          : i18n(
              'No conflicted extensions found.',
              'hook:useExtensionConflictDiagnostic'
            ))
    )
  }, [excludeIds, triggerCheckDownloadByExtId])

  // Disable all conflicted extensions
  const disableConflicted = useCallback(async () => {
    setMessage(
      i18n(
        'Disabling conflicted extensions...',
        'hook:useExtensionConflictDiagnostic'
      )
    )
    try {
      const conflictedIds = Object.entries(enabledExts).reduce<string[]>(
        (conflictedIds, [id, ext]) =>
          ext.status === ExtensionStatus.CONFLICTED
            ? conflictedIds.concat(id)
            : conflictedIds,
        []
      )
      await Promise.allSettled(
        conflictedIds.map(async id => {
          await management.setEnabled(id, false)
          dispatch({ type: 'DISABLE_EXTENSION', payload: { id } })
        })
      )
      setMessage(
        i18n(
          'All conflicted extensions have been disabled.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
      setStatus(WorkflowStatus.INIT)
    } catch (_error) {
      setMessage(
        i18n(
          'Failed to disable conflicted extensions.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
    }
  }, [enabledExts])

  return {
    installed: enabledExts,
    status,
    message,
    requestDiagnose,
    disableConflicted,
    abort: () => {
      if (status !== WorkflowStatus.RUNNING) return
      abortRef.current = true
    },
  }
}
