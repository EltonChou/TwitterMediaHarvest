export class ApiError extends Error {
  constructor(message: string, options: { requestId: string; statusCode: number }) {
    super(message + '\n' + JSON.stringify(options))
  }
}
