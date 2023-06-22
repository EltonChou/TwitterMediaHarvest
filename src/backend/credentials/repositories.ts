import type { CognitoIdentityCredentials, Storage } from '@aws-sdk/credential-provider-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import ValueObject from '@backend/valueObject'
import type { AWSCredentials } from '@schema'
import type { Storage as BrowserStorage } from 'webextension-polyfill'
import Browser from 'webextension-polyfill'

class CredentialVO extends ValueObject<AWSCredentials> {
  readonly expireTimeRedundancy: number = 3 * 60 * 1000

  constructor(props: AWSCredentials) {
    super(props)
  }

  get credential(): CognitoIdentityCredentials {
    return { ...this.props, expiration: new Date(this.props.expiration) }
  }

  get isExpired(): boolean {
    return this.props?.expiration ? this.props.expiration < Date.now() - this.expireTimeRedundancy : true
  }

  static fromCognitoIdentityCredentials(credential: CognitoIdentityCredentials): CredentialVO {
    return new CredentialVO({
      ...credential,
      // ? Does it means the credential wouldn't expired if the expiration was undefined?
      expiration: credential?.expiration ? credential.expiration.getTime() : 0,
    })
  }
}

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
  readonly credentialCriteria = 'awsCredential'

  constructor(readonly storageArea: BrowserStorage.StorageArea) {}

  private async fetchCredential(): Promise<CognitoIdentityCredentials> {
    // ! Data in storage is `AWSCredential` not `CognitoIdentityCredentials`
    // TODO: Need to define the schema of storage area.
    const credential = await fromCognitoIdentityPool({
      identityPoolId: process.env.IDENTITY_POOL_ID,
      cache: new BrowserSyncStorageProxy(),
      clientConfig: {
        region: process.env.IDENTITY_POOL_REGION,
      },
    })()

    const credentialVO = CredentialVO.fromCognitoIdentityCredentials(credential)
    await this.storageArea.set({ [this.credentialCriteria]: credentialVO.props })
    return credential
  }

  async getCredential(): Promise<CognitoIdentityCredentials> {
    const credentialRecord = await this.storageArea.get(this.credentialCriteria)
    if (Object.keys(credentialRecord).length === 0) return await this.fetchCredential()

    const credentialsVO = new CredentialVO(credentialRecord[this.credentialCriteria])
    return credentialsVO.isExpired ? await this.fetchCredential() : credentialsVO.credential
  }
}
