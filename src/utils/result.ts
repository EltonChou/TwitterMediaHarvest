export const toErrorResult = <T = unknown>(error: Error): Result<T> => ({
  error: error,
  value: undefined,
})

export const toSuccessResult = <T>(value: T): Result<T> => ({
  error: undefined,
  value: value,
})
