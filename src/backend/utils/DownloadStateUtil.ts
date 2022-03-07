enum DownloadState {
  InProgress = 'in_progress',
  Interrupted = 'interrupted',
  Complete = 'complete',
}


export default class DownloadStateUtil {
  static isInterrupted({
    current,
    previous,
  }: chrome.downloads.StringDelta) {
    return current === DownloadState.Interrupted && previous === DownloadState.InProgress
  }

  static isCompleted({
    current,
    previous,
  }: chrome.downloads.StringDelta) {
    return current === DownloadState.Complete && previous === DownloadState.InProgress
  }
}
