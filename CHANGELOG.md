# Changelog

## [4.1.6]

### Added

- Add fallback api usecase.

### Fixed

- Fixed api parsing.


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
