/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export {}

declare global {
  interface Window {
    webpackChunk_twitter_responsive_web: WebPackModuleItem[]
  }
}

type WebpackLoadFunction = (a: unknown, b: unknown, c: unknown) => void
type Module = Record<number | string, WebpackLoadFunction>
type WebPackModuleItem = [[string], Module]
type ESModule<T = unknown> = {
  default: T
  __esModule: true
}
type MakeTransactionId = (path: string, method: string) => Promise<string>

const xOpen = XMLHttpRequest.prototype.open
const xSetHeader = XMLHttpRequest.prototype.setRequestHeader

let generateTransactionId: MakeTransactionId

type TxTarget = {
  method: string
  path: string
}

const requesetPathWeakMap = new WeakMap<XMLHttpRequest, TxTarget>()
const seenQuery = new Set<string>()

const Pattern = Object.freeze({
  tweetRelated:
    /^(?:\/i\/api)?\/graphql\/(?:.+\/)?(\w+)\/(TweetDetail|TweetResultByRestId|UserTweets|UserMedia|HomeTimeline|UserTweetsAndReplies|UserHighlightsTweets|UserArticlesTweets|Bookmarks|Likes|CommunitiesExploreTimeline|ListLatestTweetsTimeline)$/,
})

const enum MediaHarvestEvent {
  MediaResponse = 'mh:media-response',
  CaptureTransactionId = 'mh:tx-id:capture',
  ResponseTransactionId = 'mh:tx-id:response',
  RequestTransactionId = 'mh:tx-id:request',
  QueryString = 'mh:query-string',
}

XMLHttpRequest.prototype.setRequestHeader = function (
  name: string,
  value: string
) {
  xSetHeader.apply(this, [name, value])

  const lowerCaseName = name.toLowerCase()
  const txTarget = requesetPathWeakMap.get(this)

  if (lowerCaseName === 'x-client-transaction-id' && txTarget)
    document.dispatchEvent(
      new CustomEvent<MediaHarvest.ClientTxIdDetail>(
        MediaHarvestEvent.CaptureTransactionId,
        {
          detail: {
            value,
            method: txTarget.method,
            path: txTarget.method,
          },
        }
      )
    )
}

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  async: boolean = true,
  username?: string | null,
  password?: string | null
) {
  const applyOriginal = () =>
    xOpen.apply(this, [method, url, async, username, password])

  let validUrl: URL | undefined = undefined
  if (url instanceof URL) {
    validUrl = url
  } else {
    const parsedUrl = URL.parse(url)
    if (parsedUrl) validUrl = parsedUrl
  }

  if (!validUrl) return applyOriginal()

  const matchedUrl = validUrl.pathname.match(Pattern.tweetRelated)
  if (validUrl && matchedUrl) {
    const [_, queryId, queryName] = matchedUrl
    const queryIdentity = makeQueryIdentity(queryName, queryId, validUrl.search)

    if (!seenQuery.has(queryIdentity)) {
      seenQuery.add(queryIdentity)
      document.dispatchEvent(
        new CustomEvent<MediaHarvest.QueryStringDetail>(
          MediaHarvestEvent.QueryString,
          {
            detail: {
              id: queryId,
              name: queryName,
              queryString: validUrl.search,
            },
          }
        )
      )
    }

    this.addEventListener('load', captureResponse)
    requesetPathWeakMap.set(this, {
      method,
      path: validUrl.pathname,
    })
  }

  applyOriginal()
}

function captureResponse(this: XMLHttpRequest, _ev: ProgressEvent) {
  if (this.status === 200) {
    const url = URL.parse(this.responseURL)
    if (!url) return

    const event = new CustomEvent<MediaHarvest.MediaResponseDetail>(
      MediaHarvestEvent.MediaResponse,
      {
        detail: {
          path: url.pathname,
          status: this.status,
          body: this.responseText,
        },
      }
    )

    document.dispatchEvent(event)
  }
}

function makeQueryIdentity(
  queryName: string,
  queryId: string,
  queryString: string
) {
  return `${queryName}|${queryId}|${queryString}`
}

self.webpackChunk_twitter_responsive_web = new Proxy<
  Window['webpackChunk_twitter_responsive_web']
>([], {
  get: function (target, prop, receiver) {
    return prop === 'push'
      ? arrayPushProxy(target.push.bind(target))
      : Reflect.get(target, prop, receiver)
  },
})

function arrayPushProxy<T>(arrayPush: Array<T>['push']) {
  return new Proxy(arrayPush, {
    apply(method, thisArg, args: WebPackModuleItem[]) {
      return Reflect.apply(
        method,
        thisArg,
        args.map(item => {
          const [[name], module] = item
          return name.includes('ondemand.s')
            ? [[name], moduleProxy(module)]
            : item
        })
      )
    },
  })
}

function moduleProxy(module: Module) {
  return new Proxy(module, {
    get(target, prop, receiver) {
      return typeof prop === 'symbol'
        ? Reflect.get(target, prop, receiver)
        : webpackLoaderFunctionProxy(target[prop])
    },
  })
}

function esModuleProxy(esModule: Partial<ESModule>) {
  return new Proxy(esModule, {
    defineProperty(target, property, attributes) {
      if (property === 'default')
        return Reflect.defineProperty(target, property, {
          ...attributes,
          configurable: true,
        })

      return Reflect.defineProperty(target, property, attributes)
    },
  })
}

function webpackLoaderFunctionProxy(loaderFunc: WebpackLoadFunction) {
  return new Proxy(loaderFunc, {
    apply(
      exportItem,
      thisArg,
      args: [object, Partial<ESModule>, CallableFunction]
    ) {
      const [_, esModule, loader] = args
      const returnVal = Reflect.apply(exportItem, thisArg, [
        _,
        esModuleProxy(esModule),
        loader,
      ])

      if (
        isESModule(esModule) &&
        isCallableFunction<() => MakeTransactionId>(esModule.default)
      ) {
        const txIdGenerator = esModule.default()
        generateTransactionId ||= txIdGenerator
        Object.defineProperty(esModule, 'default', {
          configurable: true,
          enumerable: true,
          get: () => () => txIdGenerator,
        })
      }

      return returnVal
    },
  })
}

function isESModule(value: unknown): value is ESModule {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__esModule' in value &&
    value.__esModule === true
  )
}

function isCallableFunction<T>(value: unknown): value is T {
  return typeof value === 'function'
}

document.addEventListener('mh:tx-id:request', async e => {
  const { path, method, uuid } = e.detail
  const txId = await generateTransactionId(path, method)

  document.dispatchEvent(
    new CustomEvent<MediaHarvest.TxIdResponseDetail>(
      MediaHarvestEvent.ResponseTransactionId,
      {
        detail: {
          uuid,
          value: txId,
        },
      }
    )
  )
})
