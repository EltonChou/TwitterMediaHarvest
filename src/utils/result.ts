export const toErrorResult = (error: Error): Result<any> => ({
  error: error,
  value: undefined,
})

export const toSuccessResult = <T>(value: T): Result<T> => ({
  error: undefined,
  value: value,
})
