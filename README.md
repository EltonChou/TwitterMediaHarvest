![TwitterMediaHarvest](./assets/open-graph.png)

[![Media Harvest : Twitter Media Downloader](https://img.shields.io/chrome-web-store/v/hpcgabhdlnapolkkjpejieegfpehfdok?color=00acee&style=for-the-badge)](https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok)
[![Media Harvest : Twitter Media Downloader](https://img.shields.io/chrome-web-store/users/hpcgabhdlnapolkkjpejieegfpehfdok?style=for-the-badge&color=007bc2)](https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok)
[![Chrome web store rating](https://img.shields.io/chrome-web-store/stars/hpcgabhdlnapolkkjpejieegfpehfdok?style=for-the-badge)](https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok)

[![Edge add-on version](https://img.shields.io/badge/dynamic/json?label=edge%20add-on&prefix=v&query=%24.version&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fmmijhjnobkeodfgoobnlmnpjllmlibkb&style=for-the-badge&color=00acee)](https://microsoftedge.microsoft.com/addons/detail/media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb)
[![Edge add-on users](https://img.shields.io/badge/dynamic/json?label=users&query=%24.activeInstallCount&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fmmijhjnobkeodfgoobnlmnpjllmlibkb&style=for-the-badge&color=007bc2)](https://microsoftedge.microsoft.com/addons/detail/media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb)
[![Edge add-on rating](https://img.shields.io/badge/dynamic/json?label=rating&suffix=/5&query=%24.averageRating&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fmmijhjnobkeodfgoobnlmnpjllmlibkb&style=for-the-badge&color=00ce36)](https://microsoftedge.microsoft.com/addons/detail/media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb)

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/EltonChou/TwitterMediaHarvest/test.yml?branch=main&style=flat-square)

# TwitterMediaHarvest
**Gather medias with just one-click.**

If you are a firefox user, please build the addons by your self. Feel free to open issue if you meet any problem when building.

## Features

- [x] One-click to get original-size image.
- [x] One-click to get video.
- [x] One-click to get GIF.
- [x] Auto-reveal sensitive content. (optional)
- [x] Support [TweetDeck](https://tweetdeck.twitter.com/)
- [x] Integrate with [Aria2 Explorer](https://chrome.google.com/webstore/detail/aria2-for-chrome/mpkodccbngfoacfalldjimigbofkhgjn)


## Installation
[![Microsoft store](assets/microsoft-badge.png)](https://microsoftedge.microsoft.com/addons/detail/media-harvest-twitter-m/mmijhjnobkeodfgoobnlmnpjllmlibkb)

[![Chrome web store](assets/chrome-badge.jpg)](https://chrome.google.com/webstore/detail/media-harvest-twitter-med/hpcgabhdlnapolkkjpejieegfpehfdok)

## Support the project

[![Support me on ko-fi](assets/ko-fi-badge.png)](https://ko-fi.com/eltonhy)

## Development
### Build
This project is using `yarn` as package manager.

To build the extension in local, you need to install the dependencies.

`yarn install`

and then execute

`yarn build`

if you are a firefox user, use

`yarn build:firefox`

You will get some files under `dist` and `build` directory.

