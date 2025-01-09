import Browser from 'webextension-polyfill'

const getStoreLink = () => {
  switch (process.env.TARGET) {
    case 'firefox':
      return 'https://addons.mozilla.org/firefox/addon/media-harvest/'

    case 'edge':
      return 'https://microsoftedge.microsoft.com/addons/detail/mmijhjnobkeodfgoobnlmnpjllmlibkb'

    default:
      return 'https://chrome.google.com/webstore/detail/hpcgabhdlnapolkkjpejieegfpehfdok'
  }
}

const getAria2ExplorerLink = () => {
  switch (process.env.TARGET) {
    case 'edge':
      return 'https://microsoftedge.microsoft.com/addons/detail/jjfgljkjddpcpfapejfkelkbjbehagbh'

    default:
      return 'https://chrome.google.com/webstore/detail/mpkodccbngfoacfalldjimigbofkhgjn'
  }
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
