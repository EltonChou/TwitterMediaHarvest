import { TweetInfo } from '../../typings'

enum DownloadState {
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Complete = 'complete',
}

/**
 * @param {chrome.downloads.StringDelta} param0 - downloadStateDelta
 */
export const isDownloadInterrupted = ({
  current,
  previous,
}: chrome.downloads.StringDelta) =>
  current === DownloadState.Interrupted && previous === DownloadState.InProgress

/**
 * @param {chrome.downloads.StringDelta} param0 - downloadStateDelta
 */
export const isDownloadCompleted = ({
  current,
  previous,
}: chrome.downloads.StringDelta) =>
  current === DownloadState.Complete && previous === DownloadState.InProgress

/**
 * @param tweetInfo twitter information
 */
export const isInvalidInfo = (tweetInfo: TweetInfo) =>
  !tweetInfo.screenName.length || !tweetInfo.tweetId.length


export const isDownloadRecordId = (downloadRecordId: string) =>
  Boolean(downloadRecordId.match(/^dl_(\d+)/))
