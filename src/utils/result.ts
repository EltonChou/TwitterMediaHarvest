/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const toErrorResult = <T = unknown>(error: Error): Result<T> => ({
  error: error,
  value: undefined,
})

export const toSuccessResult = <T>(value: T): Result<T> => ({
  error: undefined,
  value: value,
})

export const isErrorResult = <T>(
  result: Result<T>
): result is { error: Error; value: undefined } => {
  return result.error !== undefined
}

export const isSuccessResult = <T>(
  result: Result<T>
): result is { error: undefined; value: T } => {
  return result.error === undefined && result.value !== undefined
}
