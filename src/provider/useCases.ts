/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { BrowserDownloadFile } from '#infra/useCases/browerDownloadFile'
import { SearchDownloadHistoryFromIDB } from '#infra/useCases/searchDownloadHistoryFromIDB'
import { SearchTweetIdsByHashtagsFromIDB } from '#infra/useCases/searchTweetIdsByHashtagsFromIDB'
import { downloadIDB } from '#libs/idb/download/db'
import { runtime } from 'webextension-polyfill'

export const searchDownloadHistory = new SearchDownloadHistoryFromIDB(
  downloadIDB
)
export const searchTweetIdsByHashtags = new SearchTweetIdsByHashtagsFromIDB(
  downloadIDB
)

export const browserDownloadFile = new BrowserDownloadFile()
export const checkDownloadIsOwnBySelf = new CheckDownloadWasTriggeredBySelf(
  runtime.id
)
