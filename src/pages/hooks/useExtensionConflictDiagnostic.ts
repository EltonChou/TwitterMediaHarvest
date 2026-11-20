import ConflictAction from '#enums/ConflictAction'
import { getText as i18n } from '#libs/i18n'
import {
  isDownloadCompleted,
  isDownloadInterrupted,
} from '#utils/downloadState'
import useExtPermissions from './useExtPermissions'
import { metrics } from '@sentry/browser'
import { useCallback, useReducer, useRef, useState } from 'react'
import {
  type Downloads,
  downloads,
  management,
  runtime,
} from 'webextension-polyfill'

const CONFLICT_TEST_DATA_PATH = 'static/TEST.data'
/** Downloaded with `conflictAction: 'overwrite'`, so any other final name means interference. */
const CONFLICT_TEST_FILENAME = 'mh-conflict-test.mhtest'

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
  diagnose: () => Promise<void>
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

async function listOtherExtensions(excludeIds: string[]) {
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
  return filteredExt
}

async function disableExtension(extId: string) {
  try {
    await management.setEnabled(extId, false)
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to disable extension (id: ${extId})`)
    // eslint-disable-next-line no-console
    console.error(error)
    return false
  }
}

async function enableExtension(extId: string) {
  try {
    await management.setEnabled(extId, true)
    return true
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to enable extension (id: ${extId})`)
    // eslint-disable-next-line no-console
    console.error(error)
    return false
  }
}

/**
 * Judges the conflict-test download once it completes:
 * filename kept → compatible, renamed → conflicted, interrupted → interrupted.
 * Then removes the test file. Downloads that are not the test file are left untouched.
 */
export const makeDownloadCheckingListener =
  ({
    onCompatible,
    onConflicted,
    onInterrupted,
  }: {
    onCompatible: () => void
    onConflicted: () => void
    onInterrupted: () => void
  }): ListenerOf<Downloads.Static['onChanged']> =>
  async downloadDelta => {
    const state = downloadDelta.state
    if (!state) return
    if (!isDownloadCompleted(state) && !isDownloadInterrupted(state)) return
    const [downloadItem] = await downloads.search({
      id: downloadDelta.id,
    })
    if (downloadItem?.url !== runtime.getURL(CONFLICT_TEST_DATA_PATH)) return

    if (isDownloadInterrupted(state)) {
      onInterrupted()
      // No file on disk to remove, only the download record.
      await downloads.erase({ id: downloadItem.id })
      return
    }

    // `filename` is an absolute path; compare the basename (either path separator).
    if (downloadItem.filename.split(/[\\/]/).pop() === CONFLICT_TEST_FILENAME) {
      onCompatible()
    } else {
      onConflicted()
    }

    // Clean up downloaded test file.
    await downloads.removeFile(downloadItem.id)
    await downloads.erase({ id: downloadItem.id })
  }

/** Downloads the test file and resolves with how the currently enabled extensions treated it. */
async function runTestDownload(): Promise<ExtensionStatus> {
  using stack = new DisposableStack()
  const { promise, resolve } = Promise.withResolvers<ExtensionStatus>()

  const listener = makeDownloadCheckingListener({
    onCompatible: () => resolve(ExtensionStatus.COMPATIBLE),
    onConflicted: () => resolve(ExtensionStatus.CONFLICTED),
    onInterrupted: () => resolve(ExtensionStatus.UNKNOWN),
  })
  stack.defer(() => downloads.onChanged.removeListener(listener))
  downloads.onChanged.addListener(listener)

  // The polyfill rejects (with `runtime.lastError`) when the download cannot start.
  await downloads.download({
    filename: CONFLICT_TEST_FILENAME,
    url: runtime.getURL(CONFLICT_TEST_DATA_PATH),
    // A leftover test file would otherwise get a uniquify counter (the default isn't documented).
    conflictAction: ConflictAction.Overwrite,
    saveAs: false,
  })

  // Keep `await`: `stack` is disposed when this function returns, and without it that happens
  // right away, removing the listener before the download completes (the diagnostic hangs).
  return await promise
}

/**
 * No API tells when another extension has registered its listeners after being enabled.
 * ponytail: fixed unmeasured wait; tune it with a test extension that renames every download.
 */
const LISTENER_REGISTRATION_DELAY_MS = 1000

/**
 * This hookes provides diagnostics for extension conflicts by checking installed extensions.
 * It will test each enabled extension (except those in excludeIds) by attempting to download a test file.
 * If the download is interfered with (e.g., blocked or modified), the extension is marked as CONFLICTED.
 * *Extensions are tested one at a time, so the result of each test download belongs to the extension under test.*
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
  const [grantPermissions, revokePermissions] = useExtPermissions('management')
  const [enabledExts, dispatch] = useReducer(reducer, {})
  const [status, setStatus] = useState<WorkflowStatus>(WorkflowStatus.INIT)
  const [message, setMessage] = useState<string>('')
  const abortRef = useRef(false)

  const resetAbort = () => {
    abortRef.current = false
  }

  const listConflictedIds = useCallback(
    () =>
      Object.entries(enabledExts).reduce<string[]>(
        (conflictedIds, [id, ext]) =>
          ext.status === ExtensionStatus.CONFLICTED
            ? conflictedIds.concat(id)
            : conflictedIds,
        []
      ),
    [enabledExts]
  )

  /**
   * Grant management permission and start diagnostics.
   * If permission is denied, the process will abort.
   * The diagnostics process involves:
   * 1. Baseline: download a test file with every extension still enabled. Their listeners
   *    are already registered, so this result is reliable. Filename kept → no conflict, done.
   * 2. Otherwise disable all target extensions, then for each one: enable it, wait for it to
   *    register its listeners, download the test file, mark it COMPATIBLE / CONFLICTED / UNKNOWN,
   *    and disable it again.
   * 3. Baseline conflicted but no single extension did → the wait was too short (or the conflict
   *    needs several extensions together): report the conflict as unidentified.
   * 4. Restore all extensions to their original enabled/disabled state.
   *
   * Note: This process may take some time depending on the number of extensions to check.
   */
  const diagnose = useCallback(async () => {
    if (__METRICS__) metrics.count('diagnostics.extension_conflict.invoked', 1)

    // Async stack: restore must finish before the management permission is revoked.
    await using diagnosisStack = new AsyncDisposableStack()
    diagnosisStack.defer(() => resetAbort())

    // A download that cannot start may be temporary: treat it like an interrupted one and carry on.
    // ponytail: no retry; add one if UNKNOWN shows up often.
    const testDownload = () =>
      runTestDownload().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[diagnostic:conflict-extensions]', error)
        return ExtensionStatus.UNKNOWN
      })
    const complete = (result: string) => {
      // eslint-disable-next-line no-console
      console.info('Complete conflict diagnostics.')
      setStatus(WorkflowStatus.COMPLETED)
      setMessage(
        i18n('Scan completed.', 'hook:useExtensionConflictDiagnostic') +
          ' ' +
          result
      )
    }

    setStatus(WorkflowStatus.RUNNING)
    setMessage(
      i18n(
        'Requesting management permission...',
        'hook:useExtensionConflictDiagnostic'
      )
    )

    // Once permission has been granted, browser will grant it implicitly in future without prompting.
    const granted = await grantPermissions()
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

    diagnosisStack.defer(async () => {
      await revokePermissions()
    })

    const filteredExt = await listOtherExtensions(excludeIds)
    const extIdsToCheck = Object.keys(filteredExt)
    dispatch({ type: 'SET_EXTENSIONS', payload: filteredExt })

    // eslint-disable-next-line no-console
    console.group('Starting conflict diagnostic...')
    // eslint-disable-next-line no-console
    diagnosisStack.defer(() => console.groupEnd())
    setMessage(
      i18n('Diagnostic is running...', 'hook:useExtensionConflictDiagnostic')
    )

    // eslint-disable-next-line no-console
    if (__DEV__) console.info('Baseline test with all extensions enabled...')
    const baselineStatus = await testDownload()
    if (baselineStatus === ExtensionStatus.COMPATIBLE) {
      for (const id of extIdsToCheck) {
        dispatch({
          type: 'CHANGE_STATUS',
          payload: { id, status: ExtensionStatus.COMPATIBLE },
        })
      }
      complete(
        i18n(
          'No conflicted extensions found.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
      return
    }

    const restoreExtensionState = async () => {
      // eslint-disable-next-line no-console
      if (__DEV__) console.info('Restoring original extension states...')
      for (const [extId, ext] of Object.entries(filteredExt)) {
        try {
          await management.setEnabled(extId, ext.enabled)
        } catch (_) {
          /* eslint-disable-next-line no-console */
          console.warn(`Failed to restore extension (id: ${extId})`)
        }
      }
    }
    diagnosisStack.defer(async () => await restoreExtensionState())

    // eslint-disable-next-line no-console
    if (__DEV__) console.info('Disabling all extensions before tests...')

    await Promise.all(extIdsToCheck.map(disableExtension))

    let conflictedCount = 0
    for (const extId of extIdsToCheck) {
      if (abortRef.current) {
        // eslint-disable-next-line no-console
        if (__DEV__) console.info('Diagnostics aborted by user.')
        setMessage(
          i18n('Diagnostic is aborted.', 'hook:useExtensionConflictDiagnostic')
        )
        setStatus(WorkflowStatus.ABORTED)
        return
      }

      const enabled = await enableExtension(extId)
      await new Promise(r => setTimeout(r, LISTENER_REGISTRATION_DELAY_MS))
      const extStatus = await testDownload()
      // eslint-disable-next-line no-console
      console.info(
        {
          [ExtensionStatus.COMPATIBLE]: '✅ Compatible extension:',
          [ExtensionStatus.CONFLICTED]: '❌ Conflicted extension:',
          [ExtensionStatus.UNKNOWN]: '❔ Test download interrupted:',
        }[extStatus],
        `${filteredExt[extId].name} (${extId})`
      )
      dispatch({
        type: 'CHANGE_STATUS',
        payload: { id: extId, status: extStatus },
      })
      if (enabled && extStatus === ExtensionStatus.CONFLICTED) {
        conflictedCount += 1
      }
      await disableExtension(extId)
    }

    //TODO: Collect conflicted extensions information.

    if (conflictedCount > 0) {
      complete(
        i18n(
          '{{count}} conflicted extension(s) detected.',
          'hook:useExtensionConflictDiagnostic',
          { count: conflictedCount.toString() }
        )
      )
      return
    }

    // The baseline gave no answer (interrupted or failed), so each extension's own result stands.
    if (baselineStatus === ExtensionStatus.UNKNOWN) {
      complete(
        i18n(
          'No conflicted extensions found.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
      return
    }

    // The baseline was interfered with, but no single extension was: per-extension results can't be trusted.
    dispatch({ type: 'SET_EXTENSIONS', payload: filteredExt })
    complete(
      i18n(
        'A conflict was detected, but the extension causing it could not be identified.',
        'hook:useExtensionConflictDiagnostic'
      )
    )
  }, [excludeIds, grantPermissions, revokePermissions])

  // Disable all conflicted extensions
  const disableConflicted = useCallback(async () => {
    await using stack = new AsyncDisposableStack()
    stack.defer(async () => {
      await revokePermissions()
    })

    const granted = await grantPermissions()
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

    setMessage(
      i18n(
        'Disabling conflicted extensions...',
        'hook:useExtensionConflictDiagnostic'
      )
    )

    const conflictedIds = listConflictedIds()
    const disableResult = await Promise.all(
      conflictedIds.map(async id => {
        const isSuccess = await disableExtension(id)
        if (isSuccess) dispatch({ type: 'DISABLE_EXTENSION', payload: { id } })
        return isSuccess
      })
    )

    if (disableResult.every(Boolean)) {
      setStatus(WorkflowStatus.INIT)
      setMessage(
        i18n(
          'All conflicted extensions have been disabled.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
    } else {
      setStatus(WorkflowStatus.ERROR)
      setMessage(
        i18n(
          'Failed to disable conflicted extensions.',
          'hook:useExtensionConflictDiagnostic'
        )
      )
    }
  }, [listConflictedIds, grantPermissions, revokePermissions])

  return {
    installed: enabledExts,
    status,
    message,
    diagnose,
    disableConflicted,
    abort: () => {
      if (status !== WorkflowStatus.RUNNING) return
      abortRef.current = true
    },
  }
}
