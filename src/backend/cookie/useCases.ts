import { fetchCookie } from '../../libs/chromeApi'

export class TwitterCookiesUseCase {
  async getCt0() {
    const { value } = await fetchCookie({
      url: 'https://twitter.com',
      name: 'ct0',
    })
    return value
  }
}
