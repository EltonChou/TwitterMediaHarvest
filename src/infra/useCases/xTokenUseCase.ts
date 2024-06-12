import type { ITwitterTokenUseCase } from '#domain/useCases/twitterToken'
import { TwitterToken } from '#domain/valueObjects/twitterToken'
import Browser from 'webextension-polyfill'

export class XTokenUseCase implements ITwitterTokenUseCase {
  async getCsrfToken(): Promise<TwitterToken | undefined> {
    const cookie = await Browser.cookies.get({
      url: 'https://x.com',
      name: 'ct0',
    })

    return cookie
      ? new TwitterToken({ name: cookie.name, value: cookie.value })
      : undefined
  }

  async getGuestToken(): Promise<TwitterToken | undefined> {
    const cookie = await Browser.cookies.get({
      url: 'https://x.com',
      name: 'gt',
    })

    return cookie
      ? new TwitterToken({ name: cookie.name, value: cookie.value })
      : undefined
  }
}
