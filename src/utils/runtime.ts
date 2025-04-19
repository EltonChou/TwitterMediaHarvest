/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Browser from 'webextension-polyfill'

export const getVersion = () => Browser.runtime.getManifest().version

export const getFullVersion = () =>
  Browser.runtime.getManifest().version_name ?? getVersion()

export const getRuntimeId = () => Browser.runtime.id

export const getName = () => Browser.runtime.getManifest().name

export const getAria2ExtId = () => {
  switch (__BROWSER__) {
    case 'chrome':
      return 'mpkodccbngfoacfalldjimigbofkhgjn'

    case 'edge':
      return 'mpkodccbngfoacfalldjimigbofkhgjn'

    default:
      return 'aria2_ext_id'
  }
}
