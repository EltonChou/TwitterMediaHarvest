/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export class TimeHelper {
  static day(day: number) {
    return day * DAY
  }

  static hour(hour: number) {
    return hour * HOUR
  }

  static minute(minute: number) {
    return minute * MINUTE
  }

  static second(second: number) {
    return second * SECOND
  }

  static duration(from: Date | number, to: Date | number = Date.now()): number {
    const fromTime = from instanceof Date ? from.getTime() : from
    const toTime = to instanceof Date ? to.getTime() : to
    return toTime - fromTime
  }
}

/**
 * Creates a duration timer that captures the start time and returns an object
 * with an `end` method to calculate elapsed time in milliseconds.
 *
 * @returns An object with an `end` method that returns the elapsed duration in milliseconds.
 *
 * @example
 * ```ts
 * const timer = setDuration()
 * // ... perform some work ...
 * const elapsed = timer.end() // elapsed time in milliseconds
 * ```
 */
export const setDuration = () => {
  const start = performance.now()
  return {
    /**
     * @returns duration in milliseconds
     */
    end: () => TimeHelper.duration(start, performance.now()),
  }
}
