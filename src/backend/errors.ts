export class HarvestError extends Error { }

export class TwitterApiError extends HarvestError {
  public reason: FetchErrorReason

  constructor(reason: FetchErrorReason) {
    super(reason.message + `(statusCode: ${reason.status})`)
  }
}

export class TooManyRequest extends TwitterApiError { }
export class NotFound extends TwitterApiError { }
export class UnknownError extends TwitterApiError { }
