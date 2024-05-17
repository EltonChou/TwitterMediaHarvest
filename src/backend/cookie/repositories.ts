import browser from 'webextension-polyfill'

export interface ITwitterTokenRepository {
  getCsrfToken(): Promise<string | null>
  getGuestToken(): Promise<string | null>
}

/**
 * @deprecated
 */
export class TwitterTokenRepository implements ITwitterTokenRepository {
  async getCsrfToken(): Promise<string | null> {
    const cookie = await browser.cookies.get({
      url: 'https://twitter.com',
      name: 'ct0',
    })

    return cookie ? cookie.value : null
  }

  async getGuestToken(): Promise<string | null> {
    const cookie = await browser.cookies.get({
      url: 'https://twitter.com',
      name: 'gt',
    })
    return cookie ? cookie.value : null
  }
}

export class XTokenRepository implements ITwitterTokenRepository {
  async getCsrfToken(): Promise<string | null> {
    const cookie = await browser.cookies.get({
      url: 'https://x.com',
      name: 'ct0',
    })

    return cookie ? cookie.value : null
  }

  async getGuestToken(): Promise<string | null> {
    const cookie = await browser.cookies.get({
      url: 'https://x.com',
      name: 'gt',
    })
    return cookie ? cookie.value : null
  }
}
