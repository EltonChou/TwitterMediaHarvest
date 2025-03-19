import type { CommandCache } from '../commands/types'

export class MockCommandCache implements CommandCache {
  private readonly cache: Map<string, Response> = new Map()

  async get(request: Request): Promise<Response | undefined> {
    return this.cache.get(request.url)
  }

  async put(request: Request, response: Response): Promise<void> {
    this.cache.set(request.url, response)
  }
}
