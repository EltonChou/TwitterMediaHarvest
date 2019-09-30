import select from 'select-dom'
import { hasMedia, observeElement } from './utils'
import { makeOrigClick } from './core'

/**
 * Options of MutationObserve
 *
 * @type {JSON}
 */
const titleOptions = {
  childList: true,
  subtree: true,
}

const initialize = () => {
  const articles = select.all('article')
  for (let article of articles) {
    const checkHref = new RegExp('/status/')
    const mode = checkHref.test(window.location.pathname) ? 'append' : 'insert'
    if (hasMedia(article)) makeOrigClick(article, mode)
  }
}

const observeStream = () => {
  observeElement('section > div > div > div', mutations => {
    for (let mutation of mutations) {
      for (let addedNode of mutation.addedNodes) {
        const article = select('article', addedNode)
        if (hasMedia(article)) makeOrigClick(article, 'insert')
      }
    }
  })
}

const observeSetion = () => {
  observeElement(
    'section',
    () => {
      if (select.exists('article')) {
        initialize()
        observeStream()
      }
    },
    titleOptions
  )
}

// The entry point
observeElement(
  '#react-root > div > div',
  () => {
    if (select.exists('section')) observeSetion()
  },
  titleOptions
)
