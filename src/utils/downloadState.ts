/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Downloads } from 'webextension-polyfill'

const enum DownloadState {
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Complete = 'complete',
}

export const isDownloadInterrupted = (
  stateDelta: Downloads.StringDelta
): stateDelta is {
  current: DownloadState.Interrupted
  previous: DownloadState.InProgress
} =>
  stateDelta.current === DownloadState.Interrupted &&
  stateDelta.previous === DownloadState.InProgress

export const isDownloadCompleted = (
  stateDelta: Downloads.StringDelta
): stateDelta is {
  current: DownloadState.Complete
  previous: DownloadState.InProgress
} =>
  stateDelta.current === DownloadState.Complete &&
  stateDelta.previous === DownloadState.InProgress
