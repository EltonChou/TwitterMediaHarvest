import { BrowserDownloadFile } from '#infra/useCases/browerDownloadFile'
import { SearchDownloadHistoryFromIDB } from '#infra/useCases/searchDownloadHistoryFromIDB'
import { SearchTweetIdsByHashtagsFromIDB } from '#infra/useCases/searchTweetIdsByHashtagsFromIDB'
import { downloadIDB } from '#libs/idb/download/db'

export const searchDownloadHistory = new SearchDownloadHistoryFromIDB(
  downloadIDB
)
export const searchTweetIdsByHashtags = new SearchTweetIdsByHashtagsFromIDB(
  downloadIDB
)

export const browserDownloadFile = new BrowserDownloadFile()
