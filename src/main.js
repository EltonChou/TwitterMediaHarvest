import select from 'select-dom'
import { hasMedia, observeElement } from './utils'
import { makeHarvester } from './core'

// The entry point
function observeRoot() {
  observeElement(
    '#react-root > div > div',
    function() {
      if (select.exists('[role="region"]') && select.exists('article')) {
        initialize()
        observeTitle()
        observeStream()
        this.disconnect()
      }
    },
    {
      childList: true,
      subtree: true,
    }
  )
}

function initialize() {
  let modalQuery = '[aria-labelledby="modal-header"]'
  if (select.exists(modalQuery)) {
    makeHarvester(select(modalQuery))
    return void 0
  }

  const articles = select.all('article')
  for (let article of articles) {
    if (hasMedia(article)) makeHarvester(article)
  }
}

function observeStream() {
  observeElement('[role="region"] > div > div > div', mutations => {
    for (let mutation of mutations) {
      for (let addedNode of mutation.addedNodes) {
        const article = select('article', addedNode)
        if (hasMedia(article)) makeHarvester(article)
      }
    }
  })
}

function observeTitle() {
  observeElement(
    'title',
    function() {
      observeRoot()
      this.disconnect()
    },
    {
      childList: true,
      characterData: true,
    }
  )
}

observeRoot()
