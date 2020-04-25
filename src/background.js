import MediaTweet from './lib/MediaTweet'
import TwitterMediaFile from './lib/TwitterMediaFile'
import {
  fetchCookie,
  fetchFileNameSetting,
  setStorage,
  fetchStorage,
  clearStorage,
} from './lib/chromeApi'
import { makeChromeDownloadConfig } from './utils/maker'
import {
  CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  DEFAULT_DIRECTORY,
} from './constants'

/* eslint-disable no-console */
// eslint-disable-next-line no-undef
chrome.runtime.onInstalled.addListener(async details => {
  const reason = details.reason
  const prevVersion = details.previousVersion
  // eslint-disable-next-line no-undef
  const currentVersion = chrome.runtime.getManifest().version
  if (reason === 'update' && prevVersion !== currentVersion) {
    console.info('Previous version:', prevVersion)
    console.info('Current version:', currentVersion)
    await migrateStorage()
    console.info('The extension has been updated.')
  }
  if (reason === 'install') {
    await initStorage()
  }
})
/* eslint-enable no-console */

// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(async request => {
  await downloadMedias(request)
})

/**
 * Trigger browser-download
 *
 * @function downloadVideo
 * @param {JSON} info twitter information
 */
async function downloadMedias(info) {
  // eslint-disable-next-line no-undef
  let { value } = await fetchCookie({ url: 'https://twitter.com', name: 'ct0' })

  const twitterMedia = new MediaTweet(info.tweetID, value)
  const mediaList = await twitterMedia.fetchMediaList()
  const setting = await fetchFileNameSetting()
  for (const [i, value] of mediaList.entries()) {
    const mediaFile = new TwitterMediaFile(info, value, i)
    const fileName = mediaFile.makeFileNameBySetting(setting)
    const fileSrc = mediaFile.getSrc()
    const downloadConfig = makeChromeDownloadConfig(fileSrc, fileName)
    // eslint-disable-next-line no-undef
    chrome.downloads.download(downloadConfig)
  }
}

/* eslint-disable no-console */
async function migrateStorage() {
  console.group()
  console.info('Fetching old data...')
  const { directory, needAccount } = await fetchStorage([
    'directory',
    'needAccount',
  ])

  console.info('Migrating...')
  const filename_pattern = {
    account: needAccount,
    serial: 'file_name',
  }

  console.info('Clear old data.')
  await clearStorage()

  const dirResult = await setStorage({ directory: directory })
  const fpResult = await setStorage({
    filename_pattern: JSON.stringify(filename_pattern),
  })
  console.info('Done.')
  console.table({ ...dirResult, ...fpResult })
  console.groupEnd()
}

async function initStorage() {
  console.group()
  console.info('Initializing storage...')
  const result = await setStorage({
    directory: DEFAULT_DIRECTORY,
    filename_pattern: CHROME_STORAGE_DEFAULT_FILENAME_PATTERN_OBJECT_STRING,
  })
  console.info('Done.')
  console.table(result)
  console.groupEnd()
}
/* eslint-enable no-console */
