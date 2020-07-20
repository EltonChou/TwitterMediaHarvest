import select from 'select-dom'
import makeHarvester from './core'
import { hasMedia, isStreamLoaded } from './utils/checker'
import observeElement from './utils/observer'

const query = Object.freeze({
  root: '#react-root > div > div',
  stream: 'section[role="region"] > div > div > div',
  modal: '[aria-labelledby="modal-header"]',
  modalWrapper:
    '#react-root > div > div > div.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af.r-184en5c',
  modalThread: '[aria-labelledby="modal-header"] [aria-expanded="true"]',
})

// The entry point
function observeRoot() {
  observeElement(
    query.root,
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
  if (select.exists(query.modal)) {
    const modal = select(query.modal)
    makeHarvester(modal)
  }

  const articles = select.all('article')
  for (const article of articles) {
    if (hasMedia(article)) makeHarvester(article)
  }
}

function observeStream() {
  observeElement(query.stream, mutations => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
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
    query.modalWrapper,
    function() {
      const modalThread = select(query.modalThread)
      if (modalThread) {
        observeElement(modalThread, function() {
          initialize()
          this.disconnect()
        })
      }
    },
    {
      childList: true,
      subtree: true,
    }
  )
}

observeRoot()
