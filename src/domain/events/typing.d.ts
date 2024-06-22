interface IDomainEvent {
  readonly name: keyof DomainEventMap
  readonly occuredAt: Date
}

interface DomainEventMap {
  'runtime:status:installed': RuntimeEvent
  'runtime:status:updated': RuntimeEvent
  'download:status:canceled': DownloadDeltaEvent
  'download:status:completed': DownloadDeltaEvent
  'download:status:interrupted': DownloadInterruptedEvent
  'download:status:dispatched:browser': BrowserDownloadDispatchEvent
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

interface BrowserDownloadDispatchEvent extends IDomainEvent {
  readonly downloadId: number
  readonly tweetInfo: import('#domain/valueObjects/tweetInfo').TweetInfo
  readonly downloadConfig: import('#domain/valueObjects/downloadConfig').DownloadConfig
}

interface DownloadDeltaEvent extends IDomainEvent {
  readonly downloadDelta: import('webextension-polyfill').Downloads.OnChangedDownloadDeltaType
}

interface DownloadInterruptedEvent extends DownloadDeltaEvent {
  readonly reason: import('#enums/InterruptReason').default
}

interface DownloadFailedNotificationEvent extends IDomainEvent {
  readonly downloadId: number
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
