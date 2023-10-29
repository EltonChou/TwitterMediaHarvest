import { type IStorageProxy } from '@libs/proxy'
import { SentryExceptionRecord, SentryLastException } from '@schema'

export interface ISentryExceptionRepository {
  getLastException(): Promise<SentryLastException>
  setLastMessage(msg: string): Promise<void>
}

export class SentryExceptionRepository implements ISentryExceptionRepository {
  constructor(readonly storage: IStorageProxy<SentryExceptionRecord>) {}

  async getLastException(): Promise<SentryLastException> {
    const { lastException } = await this.storage.getItemByDefaults({
      lastException: { message: '', timestamp: new Date().getTime() },
    })
    return lastException
  }

  async setLastMessage(msg: string): Promise<void> {
    await this.storage.setItem({
      lastException: { message: msg, timestamp: new Date().getTime() },
    })
  }
}
