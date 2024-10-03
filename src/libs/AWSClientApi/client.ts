import { TimeHelper } from '#helpers/time'
import { toErrorResult, toSuccessResult } from '#utils/result'
import type {
  CreateClientCommandInput,
  CreateClientCommandOutput,
  SyncClientCommandInput,
  SyncClientCommandOutput,
} from './commands'
import type { Command } from './commands/types'
import type { Client, HttpHandlerOptions } from './types'
import { Sha256 } from '@aws-crypto/sha256-browser'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'
import { FetchHttpHandler } from '@smithy/fetch-http-handler'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'

type CommandInputs = SyncClientCommandInput | CreateClientCommandInput
type CommandOutputs = SyncClientCommandOutput | CreateClientCommandOutput

interface ClientConfiguration {
  region: string
  apiKey: string
  clientVersion: string
  hostName: string
  credentials: CognitoIdentityCredentials | Provider<CognitoIdentityCredentials>
  timeout?: number
}

export class ApiClient implements Client<CommandInputs, CommandOutputs> {
  constructor(readonly config: ClientConfiguration) {}

  private get httpHandler() {
    return new FetchHttpHandler({
      requestTimeout: this.config.timeout ?? TimeHelper.second(5),
    })
  }

  private async makeSigner() {
    return new SignatureV4({
      region: this.config.region,
      service: 'execute-api',
      credentials:
        typeof this.config.credentials === 'function'
          ? await this.config.credentials()
          : this.config.credentials,
      sha256: Sha256,
    })
  }

  async send<InputType extends CommandInputs, OutputType extends CommandOutputs>(
    command: Command<InputType, OutputType>,
    options?: HttpHandlerOptions
  ): AsyncResult<OutputType, Error> {
    let handler
    try {
      const request = command.prepareRequest({
        protocol: 'https',
        hostname: this.config.hostName,
        headers: {
          host: this.config.hostName,
          'X-Api-Key': this.config.apiKey,
          'X-MediaHarvest-Version': this.config.clientVersion,
        },
      })

      const signer = await this.makeSigner()
      const signedRequest = await signer.sign(request)
      if (!HttpRequest.isInstance(signedRequest))
        return toErrorResult(new Error('Signed request is not a valid HttpRequest.'))

      handler = this.httpHandler
      const { response } = await this.httpHandler.handle(signedRequest, options)
      const output = await command.resolveResponse(response)

      handler.destroy()
      return toSuccessResult(output)
    } catch (error) {
      handler?.destroy()
      return toErrorResult(error as Error)
    }
  }
}
