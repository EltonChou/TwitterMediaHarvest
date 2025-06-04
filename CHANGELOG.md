# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [4.4.3] - 2025-06-04

### Fixed

- Fix issue that tweet response is not cached in firefox due to schema changes. [#230](https://github.com/EltonChou/TwitterMediaHarvest/issues/230)
- Fix issue that transaction id cannot be generated in firefox. [#230](https://github.com/EltonChou/TwitterMediaHarvest/issues/230), [#232](https://github.com/EltonChou/TwitterMediaHarvest/issues/232)

## [4.4.2] - 2025-05-14

### Added

- Add cache support for `Following` timeline. [#226](https://github.com/EltonChou/TwitterMediaHarvest/issues/226)

### Fixed

- Fix issue that error response would be cached.
- Fix issue that X api request cannot be generated correctly.

## [4.4.1] - 2025-05-03

### Added

- Add cache support for more endpoints.[#219](https://github.com/EltonChou/TwitterMediaHarvest/issues/219)

### Fixed

- Fix issue that tweet with limited action cannot be cached.[#222](https://github.com/EltonChou/TwitterMediaHarvest/issues/222)

## [4.4.0] - 2025-04-30

### Added

- Capture api's response and cache, this feature can massive increases the avalibility of download. ([#212](https://github.com/EltonChou/TwitterMediaHarvest/issues/212), [#213](https://github.com/EltonChou/TwitterMediaHarvest/issues/213), [#215](https://github.com/EltonChou/TwitterMediaHarvest/issues/215), [#217](https://github.com/EltonChou/TwitterMediaHarvest/issues/217))
- Chromium based browser can request file location prompt when triggers download.

### Fixed

- Old history might be lack of hashtags property, this bug will causes error when map db item to another object. ([#211](https://github.com/EltonChou/TwitterMediaHarvest/issues/211), [#216](https://github.com/EltonChou/TwitterMediaHarvest/issues/216))

## [4.3.0] - 2025-04-26

### Added

- Filename detector for notifing user that filename has been modified by other extensions.
- More filename pattern tokens.
- User will be warned when download quota is low.
- Download history can be imported or exported.

### Removed

- Aggressive mode

### Fixed

- Status of button is unmatched when switching different tweet in photo mode.
- Fix tweet parser for fallback X api endpoint.

## [4.2.9] - 2024-09-14

### Fixed

- Fix issue that download button disappeared in quoted tweet. (#191)

## [4.2.8] - 2024-08-21

### Fixed

- Fix issue about some video media cannot be downloaded. (#182)

## [4.2.7] - 2024-05-26

### Fixed

- Fix video thumbnail download issue.

## [4.2.6] - 2024-05-17

### Fixed

- Fix token error caused by domain force redirecting.

## [4.2.5] - 2024-05-16

### Fixed

- Fix inconsistent download behavior in photo mode.
- Fix content script permission and observer selector issues. (#146)

## [4.2.4] - 2023-12-23

### Fixed

- Fix auto-revealing nsfw in new medias ui.
- Fix download button disappearing issue in modal with video content.

## [4.2.3] - 2023-11-26

### Added

- The filename pattern token can be dragged now. (#117 by @Laurens256)

### Fixed

- Fixed status anchor css selector.
- Fixed button style due to the change of x's layout.

## [4.2.2] - 2023-10-29

### Fixed

- Fixed download button position and gap due to layout change.

## [4.2.1] - 2023-10-01

### Changed

- Lazy load history items when user is typing in search input.

### Fixed

- Fixed issue tracker unexpected behavior.
- Fixed quoted content checker.
- Fixed history table page count.
- Fixed download button style, due to change of the layout.

## [4.2.0] - 2023-09-07

### Added

- Added deeper sub-directory Support.
- Added file aggregation option.
- Added download history.

### Changed

- Improve options page UI.

### Fixed

- Fixed media checker.
- Fixed tweet information parsing.
- Fixed process in guest mode.
- Fixed photo mode download button disappearing issue.

## [4.1.10] - 2023-07-24

### Added

- Added host permission `x.com` for the future.

### Fixed

- Fixed thumbnail download options.

## [4.1.9] - 2023-07-19

### Fixed

- Fixed the link in the embed video would be open by `Auto-Reveal NSFW` feature.
- Fixed that some tweet can't be parsed correctly due to the change of latest graphql api.
- Fixed that undefined action bar cause error in legacy deck.

## [4.1.8] - 2023-07-10

### Fixed

- Fixed twitter api parsing.

## [4.1.7] - 2023-07-09

### Added

- Added legacy TweetDeck support.

## [4.1.6] - 2023-07-09

### Added

- Added fallback api usecase. The extension will try to save api quota if you set `twitterApiVersion` to `v1`.

### Fixed

- Fixed api tweet user parsing.

## [4.1.5] - 2023-07-07

### Added

- Added more filename pattern tokens. (#78)

### Changed

- Changed some i18n.

### Removed

- Removed v2 endpoint support.
- Removed Legacy tweetdeck support

### Fixed

- Fixed bug that ad-tweet would be open when enable auto-revealing nsfw. (#79)

## [4.1.4] - 2023-07-04

### Fixed

- Fix filename pattern `date` incorrect month issue.
- Fix CSP.

## [4.1.3] - 2023-07-02

### Changed

- Change default api version to `gql`. (#73)
- Change notification content.

### Fixed

- Fix modal checking.
- Fix download button bugs.

## [4.1.2] - 2023-07-01

### Fixed

- Fix notification failure.
- Fix the button style cannot be initialized in some situation.

## [4.1.1] - 2023-06-25

### Fixed

- Fix Content Security Policy.

## [4.1.0] - 2023-06-25

### Changed

- Change keyboard shorcut visual in options page.
- Improve issue tracking.
- Improve download record storage with IndexedDB (if supported).

### Fixed

- Improve functional path checking.
- Fix stats refresh issue in popup.
- Fix twitter graphQL api parsing.

## [4.0.1] - 2023-05-04

### Added

- Add `Ask where to save` in firefox version.
- Add TweetDeck (beta) compatiablity.

### Fixed

- Fix TweetDeck (legacy) bugs.
- Fix logic when the tweet is in photo mode.

## [4.0.0] - 2023-04-28

### Added

- Auto-reveal sensitive content feature.
- Add popup to toggle features.

### Changed

- Renew the options page.

### Fixed

- Prevent triggering download when the user is composing tweet.
- Fixed download button color in reply-restricted tweet.
- Fixed media checking in embed tweet.

[4.4.3]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.4.2...v4.4.3
[4.4.2]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.4.1...v4.4.2
[4.4.1]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.3.0...v4.4.0
[4.3.0]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.9...v4.3.0
[4.2.9]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.8...v4.2.9
[4.2.8]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.7...v4.2.8
[4.2.7]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.6...v4.2.7
[4.2.6]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.5...v4.2.6
[4.2.5]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.4...v4.2.5
[4.2.4]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.3...v4.2.4
[4.2.3]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.2...v4.2.3
[4.2.2]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.1...v4.2.2
[4.2.1]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.2.0...v4.2.1
[4.2.0]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.10...v4.2.0
[4.1.10]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.9...v4.1.10
[4.1.9]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.8...v4.1.9
[4.1.8]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.7...v4.1.8
[4.1.7]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.6...v4.1.7
[4.1.6]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.5...v4.1.6
[4.1.5]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.4...v4.1.5
[4.1.4]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.3...v4.1.4
[4.1.3]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.2...v4.1.3
[4.1.2]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.1...v4.1.2
[4.1.1]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.1.0...v4.1.1
[4.1.0]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.0.1...v4.1.0
[4.0.1]: https://github.com/EltonChou/TwitterMediaHarvest/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/EltonChou/TwitterMediaHarvest/releases/tag/v4.0.0
