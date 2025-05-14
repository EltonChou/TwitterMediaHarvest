/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CheckDownloadWasTriggeredBySelf } from '#domain/useCases/checkDownloadWasTriggeredBySelf'
import { BrowserDownloadFile } from '#infra/useCases/browerDownloadFile'
import { NativeFetchTweetSolution } from '#infra/useCases/nativeFetchTweetSolution'
import { SearchDownloadHistoryFromIDB } from '#infra/useCases/searchDownloadHistoryFromIDB'
import { SearchTweetIdsByHashtagsFromIDB } from '#infra/useCases/searchTweetIdsByHashtagsFromIDB'
import { downloadIDB } from '#libs/idb/download/db'
import { xApiClient } from './client'
import { solutionQuotaRepo, xTokenRepo } from './repos'
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

export const nativeFetchTweetSolution = new NativeFetchTweetSolution(
  {
    xApiClient: xApiClient,
    xTokenRepo: xTokenRepo,
    solutionQuotaRepo: solutionQuotaRepo,
  },
  { quotaThreshold: 10, reservedQuota: 10 }
)
