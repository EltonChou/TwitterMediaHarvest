import type { Command, MetadataBearer } from './commands/types'

export type HttpHandlerOptions = { abortSignal: AbortSignal; timeout: number }

export interface Client<Input extends object, Output extends MetadataBearer> {
  send<InputType extends Input, OutputType extends Output>(
    command: Command<InputType, OutputType>,
    options?: HttpHandlerOptions
  ): AsyncResult<OutputType>
}
