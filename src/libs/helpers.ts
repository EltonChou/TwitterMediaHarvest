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

export const sleep = async (ms: number) =>
  new Promise((resolve, reject) => setTimeout(resolve, ms))
