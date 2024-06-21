interface IDomainEvent {
  readonly name: keyof DomainEventMap
  readonly occuredAt: Date
}

interface DomainEventMap {
  'runtime:installed': RuntimeEvent
  'runtime:updated': RuntimeEvent
  'download:canceled': DownloadEvent
  'download:completed': DownloadEvent
  'download:failed': DownloadEvent
  'filename:overwritten': IDomainEvent
  'notification:downloadFailed:self:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:self:closed': DownloadFailedNotificationEvent
  'notification:downloadFailed:viewButton:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:retryButton:clicked': DownloadFailedNotificationEvent
  'notification:tweetFetchError:self:clicked': TweetFetchErrorNotificationEvent
  'notification:tweetFetchError:self:closed': TweetFetchErrorNotificationEvent
  'notification:tweetFetchError:viewButton:clicked': TweetFetchErrorNotificationEvent
  'api:twitter:failed': TweetApiErrorEvent
  'parse:tweet:failed': TweetParsingEvent
}

interface RuntimeEvent extends IDomainEvent {
  readonly versionDelta: Delta<string>
}

interface DownloadEvent extends IDomainEvent {
  readonly downloadItem: import('webextension-polyfill').Downloads.DownloadItem
}

interface DownloadFailedEvent extends DownloadEvent {
  readonly reason: import('#enums/InterruptReason').default
}

interface DownloadFailedNotificationEvent extends IDomainEvent {
  readonly downloadId: import('webextension-polyfill').Downloads.DownloadItem['id']
}

interface TweetFetchErrorNotificationEvent extends IDomainEvent {
  readonly tweetInfo: TweetInfo
}

interface TweetApiErrorEvent extends IDomainEvent {
  readonly tweetInfo: TweetInfo
  readonly code: number
}

interface TweetParsingEvent extends IDomainEvent {
  readonly tweetInfo: TweetInfo
}
