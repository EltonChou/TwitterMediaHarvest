import type { TwitterToken } from '../valueObjects/twitterToken'

export interface ITwitterTokenRepository {
  getByName(name: string): Promise<TwitterToken | undefined>
  getCsrfToken(): Promise<TwitterToken | undefined>
  getGuestToken(): Promise<TwitterToken | undefined>
}
