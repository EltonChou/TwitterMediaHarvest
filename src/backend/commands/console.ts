/* eslint-disable no-console */
export function showUpdateMessageInConsole(previous: string) {
  const current = chrome.runtime.getManifest().version
  console.group('The extension has been updated. Expand to see the details.')
  console.info('Previous version:', previous)
  console.info('Current version:', current)
  console.groupEnd()
}
