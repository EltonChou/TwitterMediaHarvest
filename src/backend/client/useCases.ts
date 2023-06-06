import Browser from 'webextension-polyfill'
import { IClientInfoRepository, InfoSyncLock } from './repositories'

export class ClientInfoUseCase {
  constructor(private infoRepo: IClientInfoRepository) {}

  async sync(): Promise<void> {
    const lock = new InfoSyncLock(Browser.storage.local)
    if (await lock.isLocked()) return

    let err: Error = undefined
    const info = await this.infoRepo.getInfo()
    if (info.needSync) {
      await lock.acquire()
      try {
        await this.infoRepo.updateStats(info.props.csrfToken)
      } catch (error) {
        err = error
      } finally {
        await lock.release()
      }
      if (err) throw err
    }
  }
}
