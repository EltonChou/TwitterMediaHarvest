import { IClientInfoRepository } from './repositories'
import { ClientApiError } from '@backend/errors'
import { TimeHelper } from '@libs/helpers'
import Browser, { type Storage } from 'webextension-polyfill'

const INFO_SYNC_LOCK_CRITERIA = 'INFO_SYNC_LOCK'
const INFO_SYNC_LOCK_MAX_TIME = TimeHelper.minute(10)

class InfoSyncLock implements IProcessLock {
  constructor(readonly storageArea: Storage.StorageArea) {}

  async isLocked(): Promise<boolean> {
    const record = await this.storageArea.get(INFO_SYNC_LOCK_CRITERIA)
    return (
      Object.keys(record).includes(INFO_SYNC_LOCK_CRITERIA) &&
      Date.now() - record[INFO_SYNC_LOCK_CRITERIA] <= INFO_SYNC_LOCK_MAX_TIME
    )
  }

  async release(): Promise<void> {
    await this.storageArea.remove(INFO_SYNC_LOCK_CRITERIA)
  }

  async acquire(): Promise<void> {
    await this.storageArea.set({ [INFO_SYNC_LOCK_CRITERIA]: Date.now() })
  }
}

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
