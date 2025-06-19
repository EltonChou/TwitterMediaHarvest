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

let generateTransactionId: MakeTransactionId | undefined = undefined

type TxTarget = {
  method: string
  path: string
}

const requesetPathWeakMap = new WeakMap<XMLHttpRequest, TxTarget>()

const Pattern = Object.freeze({
  tweetRelated:
    /^(?:\/i\/api)?\/graphql\/(?<queryId>.+)?\/(?<queryName>TweetDetail|TweetResultByRestId|UserTweets|UserMedia|HomeTimeline|HomeLatestTimeline|UserTweetsAndReplies|UserHighlightsTweets|UserArticlesTweets|Bookmarks|Likes|CommunitiesExploreTimeline|ListLatestTweetsTimeline)$/,
})

const enum MediaHarvestEvent {
  MediaResponse = 'mh:media-response',
  ResponseTransactionId = 'mh:tx-id:response',
  RequestTransactionId = 'mh:tx-id:request',
}

function validateUrl(url: string | URL | undefined): URL | undefined {
  if (!url) return undefined
  if (url instanceof URL) return url
  if (URL.canParse(url)) return new URL(url)
  return undefined
}

XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
  apply(target, thisArg: XMLHttpRequest, args) {
    const [method, url] = args

    const validUrl = validateUrl(url)
    if (validUrl) {
      const matchedUrl = validUrl.pathname.match(Pattern.tweetRelated)
      if (validUrl && matchedUrl) {
        thisArg.addEventListener('load', captureResponse)
        requesetPathWeakMap.set(thisArg, {
          method,
          path: validUrl.pathname,
        })
      }
    }

    return Reflect.apply(target, thisArg, args)
  },
})

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
  if (generateTransactionId === undefined) return

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
