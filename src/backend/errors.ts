export class HarvestError extends Error {}

export class ApiError extends HarvestError {
  statusCode: number
}

export class ValidationError extends HarvestError {}

export class ParserError extends HarvestError {}
export class TweetParsingError extends ParserError {}
export class TweetUserParsingError extends ParserError {}
export class TweetMediaParsingError extends ParserError {}

// Twitter API
export class TwitterApiError extends ApiError {
  name = 'TwitterApiError'

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
export class Forbidden extends TwitterApiError {}

// Client API
export class ClientApiError extends ApiError {
  name = 'ClientApiError'

  constructor(statusCode: number, message: string, header: Record<string, string>) {
    const xInfo = ClientApiError.extractHeader(header)
    const msg = message + `(statusCode: ${statusCode})\n` + 'X-Headers:\n' + JSON.stringify(xInfo)
    super(msg)
    this.statusCode = statusCode
  }

  static extractHeader(header: Record<string, string>): Record<string, string> {
    return Object.fromEntries(Object.entries(header).filter(([k, v]) => k.toLowerCase().startsWith('x-')))
  }
}

export class CreateClientFailed extends ClientApiError {}
export class UpdateStatsFailed extends ClientApiError {}
