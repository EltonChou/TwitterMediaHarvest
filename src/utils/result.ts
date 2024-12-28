export const toErrorResult = <T = any>(error: Error): Result<T> => ({
  error: error,
  value: undefined,
})

export const toSuccessResult = <T>(value: T): Result<T> => ({
  error: undefined,
  value: value,
})
