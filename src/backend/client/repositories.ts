import { Sha256 } from '@aws-crypto/sha256-browser'
import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'
import { FetchHttpHandler, streamCollector } from '@aws-sdk/fetch-http-handler'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { SignatureV4 } from '@aws-sdk/signature-v4'
import { CreateClientFailed, UpdateStatsFailed } from '@backend/errors'
import type { ClientInfo, V4Statistics } from '@schema'
import jws from 'jws'
import type { Storage } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'
import { ClientInfoVO } from './valueObjects'

type UpdateInfo = Pick<ClientInfo, 'csrfToken' | 'syncedAt'>

const defaultInfo: Readonly<ClientInfo> = {
  uuid: 'uuid',
  csrfToken: 'token',
  syncedAt: 0,
  uninstallCode: 'code',
}

const isEmptyInfo = (record: Record<string, unknown>) =>
  record['uuid'] === defaultInfo.uuid ||
  record['csrfToken'] === defaultInfo.csrfToken ||
  record['syncedAt'] === defaultInfo.syncedAt ||
  record['uninstall'] === defaultInfo.uninstallCode

type ProviderOptions = {
  credentialProvider: Provider<CognitoIdentityCredentials>
  statsProvider: Provider<V4Statistics>
}

export interface IClientInfoRepository {
  getInfo(options?: ProviderOptions): Promise<ClientInfoVO>
  updateStats(options?: ProviderOptions): Promise<void>
  resetInfo(): Promise<void>
}

export class InfoSyncLock implements IProcessLock {
  private lockCriteria = 'InfoUpdateLock'

  constructor(readonly storageArea: Storage.StorageArea) {}

  async isLocked(): Promise<boolean> {
    const record = await this.storageArea.get(this.lockCriteria)
    return Object.keys(record).includes(this.lockCriteria)
  }

  async release(): Promise<void> {
    await this.storageArea.remove(this.lockCriteria)
  }

  async acquire(): Promise<void> {
    await this.storageArea.set({ [this.lockCriteria]: 1 })
  }
}

export class ClientInfoRepository implements IClientInfoRepository {
  constructor(readonly storageArea: Storage.StorageArea, private defaultOptions: ProviderOptions) {}

  private async createClient(options: ProviderOptions): Promise<ClientTokenResponse> {
    const initStats = await options.statsProvider()
    const credential = await options.credentialProvider()

    const handler = new ClientApiHandler()
    const response = await handler.send(HttpMethod.Post, '/clients', {}, initStats, credential)

    if (response.statusCode === 201) {
      const body = JSON.parse(response.body)
      return body
    }

    throw new CreateClientFailed(response.statusCode, JSON.stringify(response.body), response.headers)
  }

  async getInfo(options?: Partial<ProviderOptions>): Promise<ClientInfoVO> {
    const record: Record<keyof ClientInfo, unknown> = await this.storageArea.get(defaultInfo)
    let info: ClientInfoVO

    if (isEmptyInfo(record)) {
      const clientTokenResponse: ClientTokenResponse = await this.createClient({ ...this.defaultOptions, ...options })
      const { payload } = jws.decode(clientTokenResponse.token, { json: true })
      const clientInfo: ClientInfo = {
        uuid: payload['uuid'],
        csrfToken: clientTokenResponse.token,
        syncedAt: Date.now(),
        uninstallCode: clientTokenResponse.uninstallCode,
      }

      info = new ClientInfoVO(clientInfo)
      await this.storageArea.set(info.props)
      await Browser.runtime.setUninstallURL(info.uninstallUrl)
    } else {
      info = new ClientInfoVO({
        uuid: record.uuid as string,
        csrfToken: record.csrfToken as string,
        syncedAt: record.syncedAt as number,
        uninstallCode: record.uninstallCode as string,
      })
    }

    return info
  }

  async updateStats(options?: Partial<ProviderOptions>): Promise<void> {
    options = { ...this.defaultOptions, ...options }

    const { uuid, csrfToken } = await this.getInfo(options)
    const stats = await options.statsProvider()
    const credential = await options.credentialProvider()

    const handler = new ClientApiHandler()
    const response = await handler.send(
      HttpMethod.Put,
      '/clients/' + uuid + '/stats',
      { 'x-csrf-token': csrfToken },
      stats,
      credential
    )

    if (response.statusCode !== 200)
      throw new UpdateStatsFailed(response.statusCode, JSON.stringify(response.body), response.headers)

    const body = JSON.parse(response.body)
    const clientInfo: UpdateInfo = {
      csrfToken: body.token,
      syncedAt: Date.now(),
    }
    await this.storageArea.set(clientInfo)
  }

  async resetInfo(): Promise<void> {
    await this.storageArea.set(defaultInfo)
  }
}

enum HttpMethod {
  Post = 'POST',
  Get = 'GET',
  Put = 'PUT',
  Delete = 'DELETE',
}

class ClientApiHandler {
  async send(
    method: HttpMethod,
    path: string,
    headers: Record<string, string>,
    body: unknown,
    credentials: CognitoIdentityCredentials
  ) {
    const request = new HttpRequest({
      protocol: 'https',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': process.env.API_KEY,
        'X-MediaHarvest-Version': process.env.VERSION_NAME,
        host: process.env.API_HOSTNAME,
        ...headers,
      },
      method: method,
      hostname: process.env.API_HOSTNAME,
      path: (process.env.API_ROOT_PATH || '') + path,
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

    response.body = new TextDecoder().decode(await streamCollector(response.body))
    return response
  }
}
