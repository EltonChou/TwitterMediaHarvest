interface IDomainEvent {
  readonly name: keyof DomainEventMap
  readonly occuredAt: Date
}

interface DomainEventMap {
  'runtime:status:installed': RuntimeEvent
  'runtime:status:updated': RuntimeEvent
  'download:status:completed': DownloadEvent
  'download:status:interrupted': DownloadInterruptedEvent
  'download:status:dispatched:browser': BrowserDownloadDispatchedEvent
  'filename:overwritten': IDomainEvent
  'notification:downloadFailed:self:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:self:closed': DownloadFailedNotificationEvent
  'notification:downloadFailed:viewButton:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:retryButton:clicked': DownloadFailedNotificationEvent
  'notification:tweetFetchError:self:clicked': TweetInfoEvent
  'notification:tweetFetchError:self:closed': TweetInfoEvent
  'notification:tweetFetchError:viewButton:clicked': TweetInfoEvent
  'api:twitter:failed': TweetApiErrorEvent
  'parse:tweet:failed': TweetInfoEvent
}

interface RuntimeEvent extends IDomainEvent {
  readonly versionDelta: Delta<string>
}

interface BrowserDownloadDispatchedEvent extends IDomainEvent {
  readonly downloadId: number
  readonly tweetInfo: import('#domain/valueObjects/tweetInfo').TweetInfo
  readonly downloadConfig: import('#domain/valueObjects/downloadConfig').DownloadConfig
}

interface DownloadEvent extends IDomainEvent {
  readonly downloadId: number
}

interface DownloadInterruptedEvent extends DownloadEvent {
  readonly reason: import('#enums/InterruptReason').default
}

interface DownloadFailedNotificationEvent extends IDomainEvent {
  readonly downloadId: number
}

interface TweetInfoEvent extends IDomainEvent {
  readonly tweetInfo: TweetInfo
}

interface TweetApiErrorEvent extends TweetInfoEvent {
  readonly code: number
}
