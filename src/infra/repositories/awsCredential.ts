/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ICredentialRepository } from '#domain/repositories/credential'
import { AWSCredential } from '#domain/valueObjects/awcCredential'
import type { IStorageProxy } from '#libs/storageProxy'
import type { AWSCredentialsItem } from '#schema'
import type {
  CognitoIdentityCredentials,
  Storage,
} from '@aws-sdk/credential-provider-cognito-identity'
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'

class CredentialCache implements Storage {
  constructor(readonly storageProxy: IStorageProxy<LiteralObject>) {}

  async getItem(key: string): Promise<string | null> {
    const record = await this.storageProxy.getItemByKey(key)
    if (!record) return null
    return Object.hasOwn(record, key) ? String(record[key]) : null
  }

  async removeItem(key: string): Promise<void> {
    return this.storageProxy.removeItem(key)
  }

  async setItem(key: string, data: string): Promise<void> {
    return this.storageProxy.setItem({ [key]: data })
  }
}

type CognitoPoolConfig = {
  region: string
  identityPoolId: string
}

export class AWSCredentialRepository
  implements ICredentialRepository<AWSCredential>
{
  constructor(
    readonly storageProxy: IStorageProxy<AWSCredentialsItem>,
    private cognitoPoolConfig: CognitoPoolConfig
  ) {}

  /**
   * Cache was used to store `identityId` from {@link CognitoIdentityCredentials}
   */
  private async fetch() {
    const credential = await fromCognitoIdentityPool({
      identityPoolId: this.cognitoPoolConfig.identityPoolId,
      cache: new CredentialCache(this.storageProxy),
      clientConfig: {
        region: this.cognitoPoolConfig.region,
      },
    })()

    await this.storageProxy.setItem(cognitoCredentialToDBItem(credential))
    return cognitoCredentialToValueObject(credential)
  }

  async get(): Promise<AWSCredential> {
    const credentialDBItem =
      await this.storageProxy.getItemByKey('awsCredential')
    if (!credentialDBItem) {
      return this.fetch()
    }

    const credential = credentialDBItemToValueObject(credentialDBItem)
    return credential.isExpired ? this.fetch() : credential
  }
}

const credentialDBItemToValueObject = (
  dbItem: AWSCredentialsItem
): AWSCredential => {
  return new AWSCredential({
    ...dbItem.awsCredential,
    expiration: new Date(dbItem.awsCredential.expiration),
  })
}

const cognitoCredentialToDBItem = (
  cognitoCredential: CognitoIdentityCredentials
): AWSCredentialsItem => {
  return {
    awsCredential: {
      ...cognitoCredential,
      expiration: cognitoCredential?.expiration?.getTime() ?? 0,
    },
  }
}

const cognitoCredentialToValueObject = (
  credential: CognitoIdentityCredentials
): AWSCredential => {
  return new AWSCredential(credential)
}
