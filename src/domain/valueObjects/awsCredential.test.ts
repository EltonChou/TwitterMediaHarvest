import { AWSCredential } from '#domain/valueObjects/awcCredential'

describe('unit test for AWSCredential value object', () => {
  it('can check expiration', () => {
    const expiredCredential = new AWSCredential({
      accessKeyId: 'ACCESS_KEY_ID',
      identityId: 'IDENTITY_ID',
      secretAccessKey: 'SECRET_KEY',
      sessionToken: 'SESSION_TOKEN',
      expiration: new Date(2000, 5, 5),
    })

    expect(expiredCredential.isExpired).toBeTruthy()

    const credential = new AWSCredential({
      accessKeyId: 'ACCESS_KEY_ID',
      identityId: 'IDENTITY_ID',
      secretAccessKey: 'SECRET_KEY',
      sessionToken: 'SESSION_TOKEN',
      expiration: new Date(2222, 5, 5),
    })
    expect(credential.isExpired).toBeFalsy()

    const nonExipirationCredential = new AWSCredential({
      accessKeyId: 'ACCESS_KEY_ID',
      identityId: 'IDENTITY_ID',
      secretAccessKey: 'SECRET_KEY',
      sessionToken: 'SESSION_TOKEN',
    })
    expect(nonExipirationCredential.isExpired).toBeTruthy()
  })
})
