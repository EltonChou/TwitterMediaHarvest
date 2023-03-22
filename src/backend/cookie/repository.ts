import { fetchCookie } from '../../libs/chromeApi'

interface ITwitterTokenRepository {
  getCsrfToken(): Promise<string | null>
  getGuestToken(): Promise<string | null>
}


export class TwitterTokenRepository implements ITwitterTokenRepository {
  async getCsrfToken(): Promise<string | null> {
    const cookie = await fetchCookie({
      url: 'https://twitter.com',
      name: 'ct0',
    })

    return cookie ? cookie.value : null
  }

  async getGuestToken(): Promise<string | null> {
    const cookie = await fetchCookie({
      url: 'https://twitter.com',
      name: 'gt',
    })
    return cookie ? cookie.value : null
  }
}