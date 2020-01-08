import select from 'select-dom'
import makeHarvester from './core'
import { hasMedia, isStreamLoaded } from './utils/checker'
import observeElement from './utils/observer'

// The entry point
function observeRoot() {
  observeElement(
    '#react-root > div > div',
    function() {
      if (isStreamLoaded()) {
        initialize()
        observeTitle()
        observeModal()
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
  const modalQuery = '[aria-labelledby="modal-header"]'
  if (select.exists(modalQuery)) {
    const modal = select(modalQuery)
    makeHarvester(modal)
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

function observeModal() {
  observeElement(
    '[aria-hidden="false"]',
    mutations => {
      if (mutations[0].oldValue === 'false') initialize()
    },
    {
      attributes: true,
      attributeOldValue: true,
    }
  )
}

observeRoot()
