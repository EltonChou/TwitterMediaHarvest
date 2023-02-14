export class HarvestError extends Error { }

export class TwitterApiError extends HarvestError {
  public reason: FetchErrorReason

  constructor(reason: FetchErrorReason) {
    super(reason.message + `(statusCode: ${reason.status})`)
    this.reason = reason
  }
}

export class TooManyRequest extends TwitterApiError { }
export class NotFound extends TwitterApiError { }
export class UnknownError extends TwitterApiError { }
export class Unauthorized extends TwitterApiError { }
