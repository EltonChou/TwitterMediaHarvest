interface IDomainEvent {
  readonly name: keyof DomainEventMap
  readonly occuredAt: Date
}

interface DomainEventSource<Event extends IDomainEvent = IDomainEvent> {
  readonly events: Event[]
}

interface DomainEventMap {
  'runtime:status:installed': RuntimeInstallEvent
  'runtime:status:updated': RuntimeUpdateEvent
  'runtime:error:internal': InternalErrorEvent
  'download:status:completed': DownloadEvent
  'download:status:interrupted': DownloadInterruptedEvent
  'download:status:dispatched:browser': BrowserDownloadDispatchedEvent
  'filename:overwritten': IDomainEvent
  'notification:downloadFailed:self:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:self:closed': DownloadFailedNotificationEvent
  'notification:downloadFailed:viewButton:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:retryButton:clicked': DownloadFailedNotificationEvent
  'notification:tweetFetchError:self:clicked': TweetFetchingFailedNotificationEvent
  'notification:tweetFetchError:self:closed': TweetFetchingFailedNotificationEvent
  'notification:tweetFetchError:viewButton:clicked': TweetFetchingFailedNotificationEvent
  'notification:general:unknownButton:clicked': UnknownNotificationButtonClickedEvent
  'api:twitter:failed': TweetApiErrorEvent
  'parse:tweet:failed': TweetInfoEvent
  'client:synced': IDomainEvent
}

interface InternalErrorEvent extends IDomainEvent {
  readonly reason: string
  readonly error: Error
  readonly isExplicit: boolean
}

interface RuntimeInstallEvent extends IDomainEvent {
  readonly version: string
}

interface RuntimeUpdateEvent extends IDomainEvent {
  readonly currentVersion: string
  readonly previousVersion: string
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

interface TweetFetchingFailedNotificationEvent extends IDomainEvent {
  readonly tweetId: string
}

interface UnknownNotificationButtonClickedEvent extends IDomainEvent {
  readonly buttonIndex: number
}

interface TweetInfoEvent extends IDomainEvent {
  readonly tweetInfo: import('#domain/valueObjects/tweetInfo').TweetInfo
}

interface TweetApiErrorEvent extends TweetInfoEvent {
  readonly code: number
}
