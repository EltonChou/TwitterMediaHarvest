export class HarvestError extends Error {}

export class ApiError extends HarvestError {}

// Twitter API
export class TwitterApiError extends ApiError {
  public reason: FetchErrorReason

  constructor(reason: FetchErrorReason) {
    super(reason.message + `(statusCode: ${reason.status})`)
    this.reason = reason
  }
}

export class TooManyRequest extends TwitterApiError {}
export class NotFound extends TwitterApiError {}
export class UnknownError extends TwitterApiError {}
export class Unauthorized extends TwitterApiError {}

// Client API
export class ClientApiError extends ApiError {
  constructor(statusCode: number, message: string) {
    const msg = message + `(statusCode: ${statusCode})`
    super(msg)
  }
}

export class CreateClientFailed extends ClientApiError {}
export class UpdateStatsFailed extends ClientApiError {}
