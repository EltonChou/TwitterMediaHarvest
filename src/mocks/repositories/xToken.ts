import { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import { TwitterToken } from '#domain/valueObjects/twitterToken'

export class MockXTokenRepository implements ITwitterTokenRepository {
  async getByName(_name: string): Promise<TwitterToken | undefined> {
    throw new Error('Method not implemented.')
  }
  async getCsrfToken(): Promise<TwitterToken | undefined> {
    return this.getByName('ct0')
  }
  async getGuestToken(): Promise<TwitterToken | undefined> {
    return this.getByName('gt')
  }
}
