/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { AsyncUseCase } from './base'

export type DownloadFileCommand = {
  target: DownloadConfig
}

export type DownloadFileUseCase = AsyncUseCase<DownloadFileCommand, UnsafeTask>
