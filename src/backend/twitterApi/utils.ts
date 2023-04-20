import { NotFound, TooManyRequest, TwitterApiError, Unauthorized, UnknownError } from '../errors'
import { i18nLocalize } from '../utils/i18n'

export const getFetchError = (statusCode: number): TwitterApiError => {
  if (statusCode === 429) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedTooManyRequestsTitle'),
      message: i18nLocalize('fetchFailedTooManyRequestsMessage'),
    }
    return new TooManyRequest(reason)
  }

  if (statusCode === 404) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('fetchFailedNotFoundTitle'),
      message: i18nLocalize('fetchFailedNotFoundMessage'),
    }
    return new NotFound(reason)
  }

  if (statusCode === 401) {
    const reason: FetchErrorReason = {
      status: statusCode,
      title: i18nLocalize('backend_notification_title_unauth'),
      message: i18nLocalize('backend_notification_message_unauth'),
    }
    return new Unauthorized(reason)
  }

  const reason: FetchErrorReason = {
    status: statusCode,
    title: i18nLocalize('fetchFailedUnknownTitle') + statusCode,
    message: i18nLocalize('fetchFailedUnknownMessage'),
  }

  return new UnknownError(reason)
}
