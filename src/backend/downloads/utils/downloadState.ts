import type { Downloads } from 'webextension-polyfill'

enum DownloadState {
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Complete = 'complete',
}

export const downloadIsInterrupted = (stateDelta: Downloads.StringDelta): boolean =>
  stateDelta.current === DownloadState.Interrupted && stateDelta.previous === DownloadState.InProgress

export const downloadIsCompleted = (stateDelta: Downloads.StringDelta): boolean =>
  stateDelta.current === DownloadState.Complete && stateDelta.previous === DownloadState.InProgress
