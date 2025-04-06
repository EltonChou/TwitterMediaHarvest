/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Command, MetadataBearer } from './commands/types'

export type HttpHandlerOptions = { abortSignal: AbortSignal; timeout: number }

export interface Client<Input extends object, Output extends MetadataBearer> {
  send<InputType extends Input, OutputType extends Output>(
    command: Command<InputType, OutputType>,
    options?: HttpHandlerOptions
  ): AsyncResult<OutputType>
}
