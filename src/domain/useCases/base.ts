/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
export interface UseCase<Input, Output> {
  process(command: Input): Output
}

export interface CommandUseCase<Output> {
  process(): Output
}

export interface AsyncUseCase<Input, Output> {
  process(command: Input): Promise<Output>
}

export interface AsyncCommandUseCase<Output> {
  process(): Promise<Output>
}
