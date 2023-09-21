import type { IndexedDBDownloadHistoryRepository } from '../repositories'
import { DownloadHistoryItem } from '@schema'
import Browser from 'webextension-polyfill'

export default class DownloadHistoryUseCase {
  constructor(readonly repo: IndexedDBDownloadHistoryRepository) {}

  async import(items: DownloadHistoryItem[]) {
    const tx = await this.repo.transaction('readwrite')
    try {
      items.forEach(item => tx.store.put(item))
      tx.commit()
    } catch (err) {
      tx.abort()
    }
  }

  async export() {
    const current = new Date()
    const history = await this.repo.getAll()
    const blob = new Blob([JSON.stringify(history)], { type: 'application/json' })
    const fileUrl = await blobToDataUrl(blob)
    await Browser.downloads.download({
      url: fileUrl,
      filename:
        'media-harvest-history-' +
        current.getFullYear() +
        current.getMonth() +
        current.getDate() +
        current.getHours() +
        current.getMinutes() +
        current.getSeconds() +
        '.json',
    })
  }
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader()

    fr.addEventListener('error', reject)
    fr.addEventListener('load', e => {
      const fileUrl =
        e.target.result instanceof ArrayBuffer
          ? new TextDecoder('utf-8').decode(e.target.result)
          : e.target.result

      resolve(fileUrl)
    })

    fr.readAsDataURL(blob)
  })
