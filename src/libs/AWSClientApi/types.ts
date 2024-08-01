import type { Command, MetadataBearer } from './commands/types'

export interface Client<Input extends object, Output extends MetadataBearer> {
  send<InputType extends Input, OutputType extends Output>(
    command: Command<InputType, OutputType>
  ): AsyncResult<OutputType>
}
