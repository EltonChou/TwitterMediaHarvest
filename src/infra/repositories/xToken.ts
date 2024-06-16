import type { ITwitterTokenRepository } from '#domain/repositories/twitterToken'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import Browser from 'webextension-polyfill'

export class XTokenUseCase implements ITwitterTokenRepository {
  async getByName(name: string): Promise<TwitterToken> {
    const cookie = await Browser.cookies.get({
      url: 'https://x.com',
      name: name,
    })

    return cookie
      ? new TwitterToken({ name: cookie.name, value: cookie.value })
      : undefined
  }

  async getCsrfToken(): Promise<TwitterToken | undefined> {
    return this.getByName('ct0')
  }

  async getGuestToken(): Promise<TwitterToken | undefined> {
    return this.getByName('gt')
  }
}
