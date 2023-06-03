import type { CognitoIdentityCredentials, Storage } from '@aws-sdk/credential-provider-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import Browser from 'webextension-polyfill'

export interface ICredentialRepository {
  getCredential(): Promise<CognitoIdentityCredentials>
}

class BrowserSyncStorageProxy implements Storage {
  async getItem(key: string): Promise<string | null> {
    const record = await Browser.storage.sync.get(key)
    return Object.keys(record).length === 0 ? null : record[key]
  }

  async removeItem(key: string): Promise<void> {
    return await Browser.storage.sync.remove(key)
  }

  async setItem(key: string, data: string): Promise<void> {
    return await Browser.storage.sync.set({ [key]: data })
  }
}

export class CredentialRepository implements ICredentialRepository {
  async getCredential(): Promise<CognitoIdentityCredentials> {
    const credentials = await fromCognitoIdentityPool({
      identityPoolId: process.env.IDENTITY_POOL_ID,
      cache: new BrowserSyncStorageProxy(),
      clientConfig: {
        region: process.env.IDENTITY_POOL_REGION,
      },
    })()

    return credentials
  }
}
