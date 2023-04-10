const getStoreLink = () => {
  const TARGET = process.env.TARGET
  switch (TARGET) {
    case 'firefox':
      return 'https://addons.mozilla.org/firefox/addon/media-harvest/'

    case 'edge':
      return (
        'https://microsoftedge.microsoft.com/addons/detail/' +
        'media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb'
      )

    default:
      return 'https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok'
  }
}

const getAria2ExplorerLink = () => {
  const TARGET = process.env.TARGET
  switch (TARGET) {
    case 'edge':
      return 'https://microsoftedge.microsoft.com/addons/detail/' + 'jjfgljkjddpcpfapejfkelkbjbehagbh'

    default:
      return 'https://chrome.google.com/webstore/detail/' + 'mpkodccbngfoacfalldjimigbofkhgjn'
  }
}

const Links = {
  github: 'https://github.com/EltonChou/TwitterMediaHarvest',
  koFi: 'https://ko-fi.com/eltonhy',
  issues: 'https://github.com/EltonChou/TwitterMediaHarvest/issues',
  store: getStoreLink(),
  aria2Explorer: getAria2ExplorerLink(),
  changelog: 'https://github.com/EltonChou/TwitterMediaHarvest',
  privacy: 'https://github.com/EltonChou/TwitterMediaHarvest',
  website: 'https://github.com/EltonChou/TwitterMediaHarvest',
}

export default Links
