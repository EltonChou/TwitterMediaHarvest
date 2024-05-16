# Changelog

## Unreleased

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

### Fixed

- Fixed media checker.
- Fixed tweet information parsing.
- Fixed process in guest mode.
- Fixed photo mode download button disappearing issue.

### Changed

- Improve options page UI.


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

### Fixed

- Fixed bug that ad-tweet would be open when enable auto-revealing nsfw. (#79)

### Changed

- Changed some i18n.

### Removed

- Removed v2 endpoint support.
- Removed Legacy tweetdeck support


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

### Fixed

- Improve functional path checking.
- Fix stats refresh issue in popup.
- Fix twitter graphQL api parsing.

### Changed

- Change keyboard shorcut visual in options page.
- Improve issue tracking.
- Improve download record storage with IndexedDB (if supported).


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
