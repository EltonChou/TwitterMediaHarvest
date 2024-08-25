import type { Downloads } from 'webextension-polyfill'

enum DownloadState {
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Complete = 'complete',
}

export const isDownloadInterrupted = (stateDelta: Downloads.StringDelta): boolean =>
  stateDelta.current === DownloadState.Interrupted &&
  stateDelta.previous === DownloadState.InProgress

export const isDownloadCompleted = (stateDelta: Downloads.StringDelta): boolean =>
  stateDelta.current === DownloadState.Complete &&
  stateDelta.previous === DownloadState.InProgress
