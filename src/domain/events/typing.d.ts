/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
  'download:status:failed:browser': BrowserDownloadFailedEvent
  'download:status:dispatched:aria2': IDomainEvent
  'filename:overwritten': FilenameOverwrittenEvent
  'notification:downloadFailed:self:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:self:closed': DownloadFailedNotificationEvent
  'notification:downloadFailed:viewButton:clicked': DownloadFailedNotificationEvent
  'notification:downloadFailed:retryButton:clicked': DownloadFailedNotificationEvent
  'notification:tweetFetchError:self:clicked': TweetFetchingFailedNotificationEvent
  'notification:tweetFetchError:self:closed': TweetFetchingFailedNotificationEvent
  'notification:tweetFetchError:viewButton:clicked': TweetFetchingFailedNotificationEvent
  'notification:general:unknownButton:clicked': UnknownNotificationButtonClickedEvent
  'notification:filenameOverwritten:self:clicked': IDomainEvent
  'notification:filenameOverwritten:ignoreButton:clicked': IDomainEvent
  'api:twitter:failed': TweetApiErrorEvent
  'parse:tweet:failed': TweetInfoEvent
  'client:synced': IDomainEvent
  'tweetSolution:quota:insufficient': QuotaEvent
  'tweetSolution:quota:changed': QuotaEvent
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

interface BrowserDownloadFailedEvent extends TweetInfoEvent {
  readonly reason: Error | string
  readonly downloadConfig: import('#domain/valueObjects/downloadConfig').DownloadConfig
}

interface DownloadEvent extends IDomainEvent {
  readonly downloadId: number
}

interface DownloadInterruptedEvent extends DownloadEvent {
  readonly reason: string
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

interface TweetIdEvent extends IDomainEvent {
  readonly tweetId: string
}

interface TweetInfoEvent extends IDomainEvent {
  readonly tweetInfo: import('#domain/valueObjects/tweetInfo').TweetInfo
}

interface TweetApiErrorEvent extends TweetInfoEvent {
  readonly code: number
}

interface FilenameOverwrittenEvent extends IDomainEvent {
  readonly expectedName: string
  readonly finalName: string
}

interface SolutionEvent extends IDomainEvent {
  readonly solutionId: string
}

interface QuotaEvent extends SolutionEvent {
  readonly remainingQuota: number
  readonly resetTime: Date
}
