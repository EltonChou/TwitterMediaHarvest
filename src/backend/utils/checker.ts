import browser from 'webextension-polyfill'

/**
 * @param tweetInfo twitter information
 */
export const isInvalidInfo = (tweetInfo: TweetInfo) => !tweetInfo.screenName.length || !tweetInfo.tweetId.length

export async function isDownloadedBySelf(downloadId: number) {
  const runtimeId = browser.runtime.id
  const query = {
    id: downloadId,
  }
  const result = await browser.downloads.search(query)
  return Boolean(result.filter(item => ('byExtensionId' in item ? item.byExtensionId === runtimeId : false)).length)
}
