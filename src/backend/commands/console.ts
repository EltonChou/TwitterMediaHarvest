import type { ClientInfo } from '@schema'
import browser from 'webextension-polyfill'

/* eslint-disable no-console */
export function showUpdateMessageInConsole(previous: string) {
  const current = browser.runtime.getManifest().version
  console.group('The extension has been updated. Expand to see the details.')
  console.info('Previous version:', previous)
  console.info('Current version:', current)
  console.groupEnd()
}

export function showClientInfoInConsole(info: ClientInfo) {
  console.group('Client Information')
  console.info('Client UUID:', info.uuid)
  console.groupEnd()
}
