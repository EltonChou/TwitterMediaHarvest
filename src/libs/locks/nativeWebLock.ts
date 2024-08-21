import LockCriteria from './enums'
import { LockContext } from './types'

export const runWithWebLock =
  <T = unknown>(criteria: LockCriteria, options?: LockOptions): LockContext<T> =>
  task =>
    options
      ? navigator.locks.request(criteria, options, task)
      : navigator.locks.request(criteria, task)
