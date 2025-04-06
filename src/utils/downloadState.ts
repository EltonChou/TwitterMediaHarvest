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
): boolean =>
  stateDelta.current === DownloadState.Interrupted &&
  stateDelta.previous === DownloadState.InProgress

export const isDownloadCompleted = (
  stateDelta: Downloads.StringDelta
): boolean =>
  stateDelta.current === DownloadState.Complete &&
  stateDelta.previous === DownloadState.InProgress
