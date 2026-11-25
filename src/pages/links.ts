/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Browser from 'webextension-polyfill'

const getStoreLink = () => {
  switch (__BROWSER__) {
    case 'firefox':
      return 'https://addons.mozilla.org/firefox/addon/media-harvest/'

    case 'edge':
      return 'https://microsoftedge.microsoft.com/addons/detail/mmijhjnobkeodfgoobnlmnpjllmlibkb'

    default:
      return 'https://chrome.google.com/webstore/detail/hpcgabhdlnapolkkjpejieegfpehfdok'
  }
}

const getAria2ExplorerLink = () => {
  switch (__BROWSER__) {
    case 'edge':
      return 'https://microsoftedge.microsoft.com/addons/detail/jjfgljkjddpcpfapejfkelkbjbehagbh'

    default:
      return 'https://chrome.google.com/webstore/detail/mpkodccbngfoacfalldjimigbofkhgjn'
  }
}

export const enum UtmSource {
  Popup = 'popup',
  Options = 'options',
  /** For third-party destinations: tells them the traffic came from us. */
  MediaHarvest = 'media-harvest',
}

export const enum UtmContent {
  RateButton = 'rate-btn',
  SupportButton = 'support-btn',
  IntegrationLink = 'integration-link',
}

/** Tag owned destinations (store, Ko-fi) for GA attribution; extension pages send no useful referrer. */
export const withUtm = (
  url: string,
  source: UtmSource,
  content: UtmContent
) => {
  const u = new URL(url)
  u.searchParams.set('utm_source', source)
  u.searchParams.set('utm_medium', 'extension')
  u.searchParams.set('utm_content', content)
  return u.href
}

const Links = {
  github: 'https://github.com/EltonChou/TwitterMediaHarvest',
  koFi: 'https://ko-fi.com/eltonhy',
  issues: 'https://github.com/EltonChou/TwitterMediaHarvest/issues',
  store: getStoreLink(),
  aria2Explorer: getAria2ExplorerLink(),
  changelog:
    'https://github.com/EltonChou/TwitterMediaHarvest/blob/main/CHANGELOG.md#' +
    Browser.runtime.getManifest().version,
  privacy:
    'https://github.com/EltonChou/TwitterMediaHarvest/blob/main/PRIVACY_POLICY.md',
  website: 'https://github.com/EltonChou/TwitterMediaHarvest',
}

export default Links
