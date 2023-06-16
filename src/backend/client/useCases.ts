import Browser from 'webextension-polyfill'
import { IClientInfoRepository, InfoSyncLock } from './repositories'

export class ClientInfoUseCase {
  constructor(private infoRepo: IClientInfoRepository) {}

  async initClient(callback?: (clientId: string) => void): Promise<void> {
    const info = await this.infoRepo.getInfo()
    if (callback) callback(info.props.uuid)
  }

  async sync(): Promise<void> {
    const lock = new InfoSyncLock(Browser.storage.local)
    if (await lock.isLocked()) return
    await lock.acquire()

    let err: Error = undefined
    try {
      const info = await this.infoRepo.getInfo()
      if (info.needSync) await this.infoRepo.updateStats(info.props.csrfToken)
    } catch (error) {
      err = error
    }

    await lock.release()
    if (err) throw err
  }
}
