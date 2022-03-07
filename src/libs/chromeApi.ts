/**
 * Fetch data from chrome storage.
 * Passing null keys to get all storage item.
 *
 * @param storageArea
 */
const storageFetcher = (storageArea: chrome.storage.StorageArea) => {
  return (
    keys: string | string[] | object | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ [key: string]: any }> => {
    return new Promise(resolve => {
      storageArea.get(keys, items => resolve(items))
    })
  }
}

/**
 * Set data to chrome storage.
 *
 * @param storageArea
 */
const storageSetter = (
  storageArea: chrome.storage.StorageArea
): ((items: object) => Promise<void>) =>
  function (items) {
    return new Promise(resolve => {
      storageArea.set(items, resolve)
    })
  }

const removerKeysPretreat = (keys: string | string[]) => {
  if (typeof keys !== 'string') keys = String(keys)
  if (Array.isArray(keys)) keys.map(String)

  return keys
}

/**
 * @param storageArea
 */
const storageRemover = (
  storageArea: chrome.storage.StorageArea
): ((removerKeys: string | string[]) => Promise<void>) =>
  function (removerKeys) {
    removerKeys = removerKeysPretreat(removerKeys)

    return new Promise(resolve => {
      storageArea.remove(removerKeys, resolve)
    })
  }

/**
 * @param storageArea
 */
const storageCleaner =
  (storageArea: chrome.storage.StorageArea) => (): Promise<void> =>
    new Promise(resolve => {
      storageArea.clear(() => resolve())
    })

/**
 * Fetch chrome cookie
 */
export const fetchCookie = (
  target: chrome.cookies.Details
): Promise<chrome.cookies.Cookie> =>
  new Promise(resolve => {
    chrome.cookies.get(target, cookie => resolve(cookie))
  })

/**
 * Search browser download history with query.
 *
 * @param query
 */
export const searchDownload = async (
  query: chrome.downloads.DownloadQuery
): Promise<chrome.downloads.DownloadItem[]> => {
  return new Promise(resolve => {
    chrome.downloads.search(query, items => resolve(items))
  })
}

const langMapping = {
  en: {
    appName: {
      message: 'Media Harvest : twitter Media Downloader',
    },
    appDesc: {
      message:
        'Download videos and images from twitter or TweetDeck with only one click.',
    },
    downloadsDirectoryLabel: {
      message: 'Downloads directory',
    },
    downloadsDirectoryHelp: {
      message: 'This directory is invalid',
    },
    filenamePatternLabel: {
      message: 'Filename pattern',
    },
    filenamePatternAccount: {
      message: 'Account',
    },
    filenameSerialStyleLabel: {
      message: 'Serial style',
    },
    filenameSerialStyleFileOrder: {
      message: 'file order',
    },
    filenameSerialStyleFileName: {
      message: 'file name',
    },
    filenamePreviewLabel: {
      message: 'Preview',
    },
    submitButtonText: {
      message: 'Save',
    },
    submitButtonSuccessText: {
      message: 'Success',
    },
    notificationDLFailedTitle: {
      message: 'Download failed',
    },
    notificationDLFailedMessageFirst: {
      message: 'Media in ',
    },
    notificationDLFailedMessageLast: {
      message: ' download failed.',
    },
    notificationDLFailedButton1: {
      message: 'View',
    },
    notificationDLFailedButton2: {
      message: 'Retry',
    },
    fetchFailedTooManyRequestsTitle: {
      message: 'Too many requests.',
    },
    fetchFailedTooManyRequestsMessage: {
      message: 'Please wait for a while.',
    },
    fetchFailedUnknownTitle: {
      message: 'Unknown Error:',
    },
    fetchFailedUnknownMessage: {
      message: 'Please contact with developer.',
    },
    noSubDirectory: {
      // eslint-disable-next-line quotes
      message: "Don't create subdirectory.",
    },
  },
  ja: {
    appName: {
      message: 'Media Harvest : ツイッターメディアダウンローダー',
    },
    appDesc: {
      message:
        ' twitter や TweetDeck のビデオと画像、ワンクリックでダウンロードできる。',
    },
    downloadsDirectoryLabel: {
      message: '保存先',
    },
    downloadsDirectoryHelp: {
      message: '無効なディレクトリ',
    },
    filenamePatternLabel: {
      message: 'ファイル名仕様',
    },
    filenamePatternAccount: {
      message: 'アカウント',
    },
    filenameSerialStyleLabel: {
      message: 'シリアル番号仕様',
    },
    filenameSerialStyleFileOrder: {
      message: 'ファイル順',
    },
    filenameSerialStyleFileName: {
      message: 'ランダムファイル名',
    },
    filenamePreviewLabel: {
      message: 'プレビュー',
    },
    submitButtonText: {
      message: '保存',
    },
    submitButtonSuccessText: {
      message: '保存成功',
    },
    notificationDLFailedTitle: {
      message: 'ダウンロード失敗しました',
    },
    notificationDLFailedMessageFirst: {
      message: '',
    },
    notificationDLFailedMessageLast: {
      message: ' のメディアがダウンロード失敗しました。',
    },
    notificationDLFailedButton1: {
      message: 'ツイッターへ',
    },
    notificationDLFailedButton2: {
      message: 'やり直し',
    },
    fetchFailedTooManyRequestsTitle: {
      message: 'リクエストが頻繁に行われました',
    },
    fetchFailedTooManyRequestsMessage: {
      message: 'しばらくしてからもう一度お試しください。',
    },
    fetchFailedUnknownTitle: {
      message: '不明なエラー：',
    },
    fetchFailedUnknownMessage: {
      message: '開発者に問い合わせてください。',
    },
    noSubDirectory: {
      message: 'サブディレクトリを作成しません',
    },
  },
  zh: {
    appName: {
      message: 'Media Harvest : twitter 多媒體下載器',
    },
    appDesc: {
      message: '一鍵從 twitter 或 TweetDeck 下載影片和圖片。',
    },
    downloadsDirectoryLabel: {
      message: '下載資料夾',
    },
    downloadsDirectoryHelp: {
      message: '無效的資料夾名稱',
    },
    filenamePatternLabel: {
      message: '檔案名稱樣式',
    },
    filenamePatternAccount: {
      message: '帳號',
    },
    filenameSerialStyleLabel: {
      message: '檔案序號樣式',
    },
    filenameSerialStyleFileOrder: {
      message: '檔案順序',
    },
    filenameSerialStyleFileName: {
      message: '檔案原始名',
    },
    filenamePreviewLabel: {
      message: '預覽',
    },
    submitButtonText: {
      message: '保存',
    },
    submitButtonSuccessText: {
      message: '保存成功',
    },
    notificationDLFailedTitle: {
      message: '下載失敗',
    },
    notificationDLFailedMessageFirst: {
      message: '於 ',
    },
    notificationDLFailedMessageLast: {
      message: ' 的多媒體下載失敗。',
    },
    notificationDLFailedButton1: {
      message: '查看',
    },
    notificationDLFailedButton2: {
      message: '重試',
    },
    fetchFailedTooManyRequestsTitle: {
      message: '短時間發出過多請求',
    },
    fetchFailedTooManyRequestsMessage: {
      message: '請稍等後再試。',
    },
    fetchFailedUnknownTitle: {
      message: '未知錯誤:',
    },
    fetchFailedUnknownMessage: {
      message: '請與開發人員聯絡。',
    },
    noSubDirectory: {
      message: '不新增子資料夾',
    },
  },
}

/**
 * @param {string} kw i18n keyname
 */
export const i18nLocalize = (kw: string) => {
  //chrome.i18n.getMessage(kw)
  const userLocale = new Intl.Locale(chrome.i18n.getUILanguage())

  const locale = Object.keys(langMapping).includes(userLocale.language)
    // @ts-expect-error monkey patch
    ? langMapping[userLocale.language]
    : langMapping.en

  return locale[kw]['message']
}

/**
 * @param {string} path url path
 */
export const getExtensionURL = (path: string) => chrome.runtime.getURL(path)
export const getExtensionId = () => chrome.runtime.id
export const openOptionsPage = () => chrome.runtime.openOptionsPage()

export const fetchSyncStorage = storageFetcher(chrome.storage.sync)
export const fetchLocalStorage = storageFetcher(chrome.storage.local)
export const setSyncStorage = storageSetter(chrome.storage.sync)
export const setLocalStorage = storageSetter(chrome.storage.local)
export const removeFromSyncStorage = storageRemover(chrome.storage.sync)
export const removeFromLocalStorage = storageRemover(chrome.storage.local)
export const clearSyncStorage = storageCleaner(chrome.storage.sync)
export const clearLocalStorage = storageCleaner(chrome.storage.local)
