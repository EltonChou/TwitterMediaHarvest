import type { TwitterToken } from '../valueObjects/twitterToken'

export interface ITwitterTokenUseCase {
  getCsrfToken(): Promise<TwitterToken | undefined>
  getGuestToken(): Promise<TwitterToken | undefined>
}
