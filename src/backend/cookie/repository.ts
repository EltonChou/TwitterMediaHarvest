import browser from 'webextension-polyfill'

export interface ITwitterTokenRepository {
  getCsrfToken(): Promise<string | null>
  getGuestToken(): Promise<string | null>
}

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
