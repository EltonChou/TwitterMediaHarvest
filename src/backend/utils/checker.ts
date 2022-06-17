import { getExtensionId, searchDownload } from '../../libs/chromeApi'

/**
 * @param tweetInfo twitter information
 */
export const isInvalidInfo = (tweetInfo: TweetInfo) =>
  !tweetInfo.screenName.length || !tweetInfo.tweetId.length


export async function isDownloadedBySelf(downloadId: number) {
  const runtimeId = getExtensionId()
  const query = {
    id: downloadId,
  }
  let result = await searchDownload(query)
  result = result.filter(item =>
    'byExtensionId' in item ?
      item.byExtensionId === runtimeId : false
  )

  return Boolean(result.length)
}