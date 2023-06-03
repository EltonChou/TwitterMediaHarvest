import { Sha256 } from '@aws-crypto/sha256-browser'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'
import { FetchHttpHandler } from '@aws-sdk/fetch-http-handler'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { SignatureV4 } from '@aws-sdk/signature-v4'
import { CreateClientFailed, UpdateStatsFailed } from '@backend/errors'
import ValueObject from '@backend/valueObject'
import jws from 'jws'
import type { Storage } from 'webextension-polyfill'

type ClientInfoKey = keyof ClientInfo

const defaultInfo: Readonly<ClientInfo> = {
  uuid: 'uuid',
  csrfToken: 'token',
  syncedAt: 0,
}

class ClientInfoVO extends ValueObject<ClientInfo> {
  private syncPeriod: number = 10 * 60 * 1000

  constructor(info: ClientInfo) {
    super(info)
  }

  get needSync(): boolean {
    return Date.now() - this.props.syncedAt >= this.syncPeriod
  }
}

const isEmptyInfo = (record: Record<string, unknown>) =>
  record['uuid'] === defaultInfo.uuid &&
  record['token'] === defaultInfo.csrfToken &&
  record['syncedAt'] === defaultInfo.syncedAt

type Provider<T> = (() => T) | (() => Promise<T>)

type ProviderOptions = {
  credentialProvider?: Provider<CognitoIdentityCredentials>
  statsProvider?: Provider<V4Statistics>
}

export interface IClientInfoRepository {
  getInfo(options?: ProviderOptions): Promise<ClientInfoVO>
  updateStats(options?: ProviderOptions): Promise<void>
}

export class ClientInfoRepository implements IClientInfoRepository {
  constructor(readonly storageArea: Storage.StorageArea, private defaultOptions: ProviderOptions) {}

  private async createClient(options: ProviderOptions): Promise<ClientTokenResponse> {
    const initStats = await options.statsProvider()
    const credential = await options.credentialProvider()

    const handler = new ClientApiHandler()
    const response = await handler.send(HttpMethod.Put, '/clients', initStats, credential)

    if (response.statusCode === 201) return response.body
    throw new CreateClientFailed(response.statusCode, JSON.stringify(response.body))
  }

  async getInfo(options?: ProviderOptions): Promise<ClientInfoVO> {
    const record: Record<ClientInfoKey, unknown> = await this.storageArea.get(defaultInfo)

    if (!isEmptyInfo(record)) {
      return new ClientInfoVO({
        uuid: record.uuid as string,
        csrfToken: record.csrfToken as string,
        syncedAt: record.syncedAt as number,
      })
    }

    const clientTokenResponse: ClientTokenResponse = await this.createClient({ ...this.defaultOptions, ...options })
    const { payload } = jws.decode(clientTokenResponse.token, { json: true })
    const clientInfo: ClientInfo = {
      uuid: payload['uuid'],
      csrfToken: clientTokenResponse.token,
      syncedAt: Date.now(),
    }

    await this.storageArea.set(clientInfo)

    return new ClientInfoVO(clientInfo)
  }

  async updateStats(options?: ProviderOptions): Promise<void> {
    options = { ...this.defaultOptions, ...options }

    const stats = await options.statsProvider()
    const credential = await options.credentialProvider()

    const handler = new ClientApiHandler()
    const response = await handler.send(HttpMethod.Put, '/clients/stats', stats, credential)

    if (response.statusCode === 200) return
    throw new UpdateStatsFailed(response.statusCode, JSON.stringify(response.body))
  }
}

enum HttpMethod {
  Post = 'POST',
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
}

class ClientApiHandler {
  async send(method: HttpMethod, path: string, body: unknown, credentials: CognitoIdentityCredentials) {
    const request = new HttpRequest({
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.API_KEY,
      },
      method: method,
      hostname: process.env.API_HOSTNAME,
      path: process.env.API_STAGE + path,
    })

    const signer = new SignatureV4({
      region: 'ap-northeast-1',
      service: 'execute-api',
      credentials: credentials,
      sha256: Sha256,
    })

    const signedRequest = await signer.sign(request)

    const client = new FetchHttpHandler()
    const { response } = await client.handle(signedRequest as HttpRequest)
    return response
  }
}
