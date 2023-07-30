import browser from 'webextension-polyfill'

/**
 * @param tweetInfo twitter information
 */
export const isValidInfo = (tweetInfo: TweetInfo) => Object.values(tweetInfo).every(v => v !== undefined)

export async function isDownloadedBySelf(downloadId: number) {
  const runtimeId = browser.runtime.id
  const query = {
    id: downloadId,
  }
  const result = await browser.downloads.search(query)
  return Boolean(result.filter(item => ('byExtensionId' in item ? item.byExtensionId === runtimeId : false)).length)
}
