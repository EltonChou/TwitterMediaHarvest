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
}
