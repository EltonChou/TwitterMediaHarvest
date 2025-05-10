/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

declare module '*.svg' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any
  export default content
}

type TweetMode = 'photo' | 'status' | 'stream'

interface IHarvestObserver {
  observeRoot: () => void
  initialize: () => void
}

interface IHarvester {
  appendButton: () => void
}

type Provider<T> = () => T
type AsyncProvider<T> = () => Promise<T>

interface LiteralObject {
  [index: string]: unknown
}

type Delta<T> = {
  previous: T
  current: T
}

type NullableDelta<T> =
  | {
      previous?: T
      current: T
    }
  | {
      previous: T
      current?: T
    }

type UnsafeTask<Err extends Error = Error> = Err | Error | void
type Result<T, Err extends Error = Error> =
  | { value: undefined; error: Err }
  | { value: T; error: undefined }
type AsyncResult<T, Err extends Error = Error> = Promise<Result<T, Err>>

type SuccessResult<ResultT> =
  ResultT extends Result<infer T> ? { value: T; error: undefined } : never
type FailedResult<ResultT> =
  ResultT extends Result<unknown, infer E>
    ? { value: undefined; error: E }
    : never
type ValueOfResult<ResultT> =
  ResultT extends Result<infer T> ? NonNullable<T> : never
type ErrorOfResult<ResultT> =
  ResultT extends Result<unknown, infer E> ? NonNullable<E> : never

type ListenerOf<T> = T extends {
  addListener: (callback: infer Listener, ...params: infer Args) => void
}
  ? Listener
  : T extends {
        addEventListener: (
          type: infer Type,
          listener: infer Listener,
          options?: infer Options
        ) => void
      }
    ? Listener
    : never

type Assert<A, B extends A> = (a: A) => a is B
