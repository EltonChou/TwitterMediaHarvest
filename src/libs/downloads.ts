/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/**
 * The part of the `downloads` API this extension uses.
 *
 * Chrome, Edge and Firefox use the browser's own API. Safari has none, so it
 * uses `safariNative/safariDownloads`, which saves files through the macOS app.
 * Every call is looked up when it is made, so tests can still mock
 * `webextension-polyfill`.
 */
import * as safariDownloads from './safariNative/safariDownloads'
import type { Downloads } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

type DownloadsApi = Pick<
  Downloads.Static,
  'download' | 'search' | 'erase' | 'removeFile'
> & {
  onChanged: Pick<
    Downloads.Static['onChanged'],
    'addListener' | 'removeListener' | 'hasListener'
  >
}

const impl = (): DownloadsApi =>
  __SAFARI__ ? safariDownloads : Browser.downloads

export const downloads: DownloadsApi = {
  download: options => impl().download(options),
  search: query => impl().search(query),
  erase: query => impl().erase(query),
  removeFile: id => impl().removeFile(id),
  onChanged: {
    addListener: listener => impl().onChanged.addListener(listener),
    removeListener: listener => impl().onChanged.removeListener(listener),
    hasListener: listener => impl().onChanged.hasListener(listener),
  },
}
