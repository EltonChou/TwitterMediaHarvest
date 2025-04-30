/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import ConflictAction from '#enums/ConflictAction'
import type { Downloads } from 'webextension-polyfill'

export const toFilename: Factory<DownloadConfig, string> = config =>
  config.mapBy(props => props.filename)

export const downloadConfigToBrowserDownloadOptions = (
  config: DownloadConfig
): Downloads.DownloadOptionsType =>
  config.mapBy(props => {
    const options = {
      filename: props.filename,
      conflictAction: props.conflictAction,
      url: props.url,
      saveAs: props.saveAs,
    }

    // `prompt` is not implemented in firefox
    if (__FIREFOX__ && options.conflictAction === ConflictAction.Prompt) {
      const { conflictAction, ...rest } = options
      return rest
    }

    return options
  })
