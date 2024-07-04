import type { DomainEventHandler } from '#domain/eventPublisher'
import type { Notifier } from '#domain/notifier'
import { TweetFetchErrorNotificationConfig } from '#helpers/notificationConfig'
import { makeTweetFetchErrorNotificationId } from '#helpers/notificationId'
import type { Notifications } from 'webextension-polyfill'

export const notifyTweetApiError =
  (
    notifier: Notifier<Notifications.CreateNotificationOptions>
  ): DomainEventHandler<TweetApiErrorEvent> =>
  async event => {
    const notificationId = makeTweetFetchErrorNotificationId(event.tweetInfo.tweetId)
    let notificatonConfig: Notifications.CreateNotificationOptions | undefined = undefined

    switch (event.code) {
      case 429:
        notificatonConfig = TweetFetchErrorNotificationConfig.tooManyRequests({
          tweetInfo: event.tweetInfo,
          eventTime: event.occuredAt,
        })
        break

      case 401:
        notificatonConfig = TweetFetchErrorNotificationConfig.unauthorized({
          tweetInfo: event.tweetInfo,
          eventTime: event.occuredAt,
        })
        break

      case 403:
        notificatonConfig = TweetFetchErrorNotificationConfig.forbidden({
          tweetInfo: event.tweetInfo,
          eventTime: event.occuredAt,
        })
        break

      case 404:
        notificatonConfig = TweetFetchErrorNotificationConfig.notFound({
          tweetInfo: event.tweetInfo,
          eventTime: event.occuredAt,
        })
        break

      default:
        notificatonConfig = TweetFetchErrorNotificationConfig.unknown({
          tweetInfo: event.tweetInfo,
          eventTime: event.occuredAt,
          code: event.code,
        })
        break
    }

    if (notificatonConfig) notifier.notify(notificationId, notificatonConfig)
  }
