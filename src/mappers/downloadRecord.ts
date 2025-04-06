/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Factory } from '#domain/factories/base'
import type { DownloadConfig } from '#domain/valueObjects/downloadConfig'
import type { DownloadRecord } from '#domain/valueObjects/downloadRecord'

export const toDownloadConfig: Factory<
  DownloadRecord,
  DownloadConfig
> = record => record.mapBy(props => props.downloadConfig)
