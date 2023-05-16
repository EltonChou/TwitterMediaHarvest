import type { CognitoIdentityCredentials } from '@aws-sdk/credential-provider-cognito-identity'
import ValueObject from '@backend/valueObject'
import jws from 'jws'
import type { Storage } from 'webextension-polyfill'

type ClientInfoKey = keyof ClientInfo

const defaultInfo: ClientInfo = Object.freeze({
  uuid: 'uuid',
  csrfToken: 'token',
  syncedAt: 0,
})

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

type CredentialProvider = (() => CognitoIdentityCredentials) | (() => Promise<CognitoIdentityCredentials>)

export interface IClientInfoRepository {
  getInfo(): Promise<ClientInfoVO>
  syncStats(stats: V4Statistics): Promise<void>
}

export class ClientInfoRepository implements IClientInfoRepository {
  constructor(readonly storageArea: Storage.StorageArea, readonly credentialProvider: CredentialProvider) {}

  async getInfo(stats?: V4Statistics): Promise<ClientInfoVO> {
    const record: Record<ClientInfoKey, unknown> = await this.storageArea.get(defaultInfo)

    if (!isEmptyInfo(record)) {
      return new ClientInfoVO({
        uuid: record.uuid as string,
        csrfToken: record.csrfToken as string,
        syncedAt: record.syncedAt as number,
      })
    }

    const credentials = await this.credentialProvider()
    const clientTokenResponse: ClientTokenResponse = createClient(
      credentials,
      stats || { trafficUsage: 0, downloadCount: 0 }
    )
    const { payload } = jws.decode(clientTokenResponse.token, { json: true })
    const clientInfo: ClientInfo = {
      uuid: payload['uuid'],
      csrfToken: clientTokenResponse.token,
      syncedAt: Date.now(),
    }

    await this.storageArea.set(clientInfo)

    return new ClientInfoVO(clientInfo)
  }

  async syncStats(stats: V4Statistics): Promise<void> {
    const credentials = await this.credentialProvider()
    const record: Record<ClientInfoKey, unknown> = await this.storageArea.get(defaultInfo)
    updateStats(credentials, record.csrfToken as string, stats)
  }
}

function createClient(credentials: CognitoIdentityCredentials, payload: V4Statistics): ClientTokenResponse {
  // TODO: create client
  throw new Error('Function not implemented.')
}

function updateStats(credentials: CognitoIdentityCredentials, csrfToken: string, payload: V4Statistics) {
  // TODO: update stats
  throw new Error('Function not implemented.')
}
