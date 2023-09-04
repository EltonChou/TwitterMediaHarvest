import { IClientInfoRepository, InfoSyncLock } from './repositories'
import { ClientApiError } from '@backend/errors'
import Browser from 'webextension-polyfill'

export class ClientInfoUseCase {
  constructor(private infoRepo: IClientInfoRepository) {}

  async initClient(callback?: (clientId: string) => void): Promise<void> {
    const info = await this.infoRepo.getInfo()
    if (callback) callback(info.uuid)
  }

  async sync(): Promise<void> {
    const lock = new InfoSyncLock(Browser.storage.local)
    if (await lock.isLocked()) return
    await lock.acquire()

    let err: Error = undefined
    try {
      const info = await this.infoRepo.getInfo()
      if (info.needSync) await this.infoRepo.updateStats()
    } catch (error) {
      if (error instanceof ClientApiError) {
        console.error(error.message)
        // if (error.statusCode === 404) await this.infoRepo.resetInfo()
      } else {
        err = error
      }
    } finally {
      await lock.release()
    }

    if (err) throw err
  }
}
