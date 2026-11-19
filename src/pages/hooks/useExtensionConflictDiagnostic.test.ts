/**
 * @jest-environment jsdom
 */
import {
  type DiagnosticsResult,
  ExtensionStatus,
  WorkflowStatus,
  makeDownloadCheckingListener,
  useExtensionConflictDiagnostic,
} from './useExtensionConflictDiagnostic'
import { act, renderHook } from '@testing-library/react'
import {
  type Downloads,
  downloads,
  permissions,
  runtime,
} from 'webextension-polyfill'

describe('useExtensionConflictDiagnostic', () => {
  const setEnabled = jest.fn()
  const changeListeners = new Set<
    (delta: Downloads.OnChangedDownloadDeltaType) => void
  >()

  /**
   * Fake browser: every extension in `renamers` renames each download while its listener is registered.
   * Disabling drops the listener; enabling registers it again only when `registersOnEnable`.
   */
  const fakeBrowser = ({
    renamers,
    registersOnEnable,
  }: {
    renamers: string[]
    registersOnEnable: boolean
  }) => {
    const listening = new Set(renamers)
    setEnabled.mockImplementation(async (id: string, enabled: boolean) => {
      if (!enabled) listening.delete(id)
      else if (registersOnEnable && renamers.includes(id)) listening.add(id)
    })
    downloads.download = jest.fn(
      async ({
        filename: requested = '',
        conflictAction,
      }: Downloads.DownloadOptionsType) => {
        // A leftover test file exists: only `overwrite` keeps the requested name,
        // otherwise uniquify inserts a counter before the extension.
        const kept =
          conflictAction === 'overwrite'
            ? requested
            : requested.replace(/(\.[^.]+)$/, ' (1)$1')
        const filename =
          listening.size > 0 ? '/dl/renamed.mhtest' : `/dl/${kept}`
        downloads.search = jest.fn().mockResolvedValue([
          {
            id: 1,
            url: runtime.getURL('static/TEST.data'),
            filename,
          } as Downloads.DownloadItem,
        ])
        // Only listeners still registered when the download completes hear about it.
        setTimeout(() =>
          changeListeners.forEach(listener =>
            listener({
              id: 1,
              state: { previous: 'in_progress', current: 'complete' },
            })
          )
        )
        return 1
      }
    )
  }

  const runDiagnose = (result: { current: DiagnosticsResult }) =>
    act(async () => {
      const done = result.current.diagnose()
      await jest.runAllTimersAsync()
      await done
    })

  beforeAll(() => {
    permissions.request = jest.fn().mockResolvedValue(true)
    permissions.remove = jest.fn().mockResolvedValue(true)
    runtime.getURL = jest.fn(path => `chrome-extension://self/${path}`)
    // jest-webextension-mock provides neither `management` nor `downloads.onChanged`.
    Object.assign(chrome, {
      management: {
        getAll: jest.fn().mockResolvedValue([
          { id: 'ext-a', type: 'extension', enabled: true, name: 'A' },
          { id: 'ext-b', type: 'extension', enabled: true, name: 'B' },
        ]),
        setEnabled,
      },
    })
    Object.assign(downloads, {
      onChanged: {
        addListener: jest.fn(listener => changeListeners.add(listener)),
        removeListener: jest.fn(listener => changeListeners.delete(listener)),
      },
    })
  })

  beforeEach(() => jest.useFakeTimers())

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it.each<{
    name: string
    renamers: string[]
    registersOnEnable: boolean
    statuses: Record<string, ExtensionStatus>
    disablesExtensions: boolean
  }>([
    {
      name: 'no conflict: ends after the baseline without disabling anything',
      renamers: [],
      registersOnEnable: true,
      statuses: {
        'ext-a': ExtensionStatus.COMPATIBLE,
        'ext-b': ExtensionStatus.COMPATIBLE,
      },
      disablesExtensions: false,
    },
    {
      name: 'conflict: identifies the renaming extension',
      renamers: ['ext-b'],
      registersOnEnable: true,
      statuses: {
        'ext-a': ExtensionStatus.COMPATIBLE,
        'ext-b': ExtensionStatus.CONFLICTED,
      },
      disablesExtensions: true,
    },
    {
      name: 'conflict hidden by late listener registration: reported as unidentified',
      renamers: ['ext-b'],
      registersOnEnable: false,
      statuses: {
        'ext-a': ExtensionStatus.UNKNOWN,
        'ext-b': ExtensionStatus.UNKNOWN,
      },
      disablesExtensions: true,
    },
  ])(
    '$name',
    async ({ renamers, registersOnEnable, statuses, disablesExtensions }) => {
      fakeBrowser({ renamers, registersOnEnable })
      const { result } = renderHook(() => useExtensionConflictDiagnostic())

      await runDiagnose(result)

      expect(result.current.status).toBe(WorkflowStatus.COMPLETED)
      expect(
        Object.fromEntries(
          Object.entries(result.current.installed).map(([id, ext]) => [
            id,
            ext.status,
          ])
        )
      ).toEqual(statuses)
      expect(setEnabled.mock.calls.some(([, enabled]) => !enabled)).toBe(
        disablesExtensions
      )
    }
  )

  it('fails instead of hanging when the test download cannot start', async () => {
    downloads.download = jest.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useExtensionConflictDiagnostic())

    await act(() => expect(result.current.diagnose()).rejects.toThrow('boom'))

    expect(result.current.status).toBe(WorkflowStatus.ERROR)
  })

  it('listens for download changes only while a test download runs', async () => {
    fakeBrowser({ renamers: ['ext-b'], registersOnEnable: true })
    const { result } = renderHook(() => useExtensionConflictDiagnostic())

    await runDiagnose(result)

    expect(result.current.status).toBe(WorkflowStatus.COMPLETED)
    expect(changeListeners.size).toBe(0)
  })

  it('restores every extension before revoking the management permission', async () => {
    fakeBrowser({ renamers: ['ext-b'], registersOnEnable: true })
    const { result } = renderHook(() => useExtensionConflictDiagnostic())

    await runDiagnose(result)

    const [revokeOrder] = jest.mocked(permissions.remove).mock
      .invocationCallOrder
    expect(Math.max(...setEnabled.mock.invocationCallOrder)).toBeLessThan(
      revokeOrder
    )
  })
})

describe('makeDownloadCheckingListener', () => {
  const testDataUrl = 'chrome-extension://self/static/TEST.data'
  const onCompatible = jest.fn()
  const onConflicted = jest.fn()
  const onInterrupted = jest.fn()
  const listener = makeDownloadCheckingListener({
    onCompatible,
    onConflicted,
    onInterrupted,
  })

  beforeAll(() => {
    runtime.getURL = jest.fn(path => `chrome-extension://self/${path}`)
    downloads.removeFile = jest.fn().mockResolvedValue(undefined)
    downloads.erase = jest.fn().mockResolvedValue([])
  })

  afterEach(() => jest.clearAllMocks())

  // `DownloadDelta.state` is a StringDelta: real deltas carry both sides of the transition.
  const completed = { previous: 'in_progress', current: 'complete' }
  const interrupted = { previous: 'in_progress', current: 'interrupted' }
  const resumed = { previous: 'interrupted', current: 'in_progress' }

  it.each<{
    name: string
    state: Downloads.StringDelta
    url: string
    filename: string
    result: 'compatible' | 'conflicted' | 'unknown' | 'ignored'
  }>([
    {
      name: 'test file keeps its name',
      state: completed,
      url: testDataUrl,
      filename: '/dl/mh-conflict-test.mhtest',
      result: 'compatible',
    },
    {
      name: 'test file keeps its name on Windows',
      state: completed,
      url: testDataUrl,
      filename: 'C:\\Users\\me\\Downloads\\mh-conflict-test.mhtest',
      result: 'compatible',
    },
    {
      // `overwrite` is requested, so a uniquify counter means another extension's suggestion won.
      name: 'test file gets a uniquify counter',
      state: completed,
      url: testDataUrl,
      filename: '/dl/mh-conflict-test (1).mhtest',
      result: 'conflicted',
    },
    {
      name: 'test file name kept only as a suffix',
      state: completed,
      url: testDataUrl,
      filename: '/dl/renamed-mh-conflict-test.mhtest',
      result: 'conflicted',
    },
    {
      name: 'test file renamed by another extension',
      state: completed,
      url: testDataUrl,
      filename: '/dl/renamed.mhtest',
      result: 'conflicted',
    },
    {
      name: 'unrelated download completes',
      state: completed,
      url: 'https://example.com/photo.jpg',
      filename: '/dl/photo.jpg',
      result: 'ignored',
    },
    {
      name: 'test file resumed after interruption',
      state: resumed,
      url: testDataUrl,
      filename: '/dl/mh-conflict-test.mhtest',
      result: 'ignored',
    },
    {
      name: 'test file interrupted',
      state: interrupted,
      url: testDataUrl,
      filename: '/dl/mh-conflict-test.mhtest',
      result: 'unknown',
    },
    {
      name: 'unrelated download interrupted',
      state: interrupted,
      url: 'https://example.com/photo.jpg',
      filename: '/dl/photo.jpg',
      result: 'ignored',
    },
  ])('$name -> $result', async ({ state, url, filename, result }) => {
    downloads.search = jest
      .fn()
      .mockResolvedValue([{ id: 1, url, filename } as Downloads.DownloadItem])

    await listener({ id: 1, state })

    const judged = result === 'compatible' || result === 'conflicted'
    expect(onCompatible).toHaveBeenCalledTimes(result === 'compatible' ? 1 : 0)
    expect(onConflicted).toHaveBeenCalledTimes(result === 'conflicted' ? 1 : 0)
    expect(onInterrupted).toHaveBeenCalledTimes(result === 'unknown' ? 1 : 0)
    // Interrupted downloads may have no file on disk, so only erase the record.
    expect(downloads.removeFile).toHaveBeenCalledTimes(judged ? 1 : 0)
    expect(downloads.erase).toHaveBeenCalledTimes(result === 'ignored' ? 0 : 1)
  })
})
