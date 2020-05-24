import select from 'select-dom'
import makeHarvester from './core'
import { hasMedia, isStreamLoaded } from './utils/checker'
import observeElement from './utils/observer'

//FIXME: Need more efficient way to manage selector

const ROOT_QUERY = '#react-root > div > div'
const STREAM_QUERY = 'section[role="region"] > div > div > div'
const MODAL_QUERY = '[aria-labelledby="modal-header"]'
const MODAL_WRAPPER_QUERY =
  '#react-root > div > div > div.r-1d2f490.r-u8s1d.r-zchlnj.r-ipm5af.r-184en5c'
const MODAL_THREAD_QUERY =
  '[aria-labelledby="modal-header"] [aria-expanded="true"]'

// The entry point
function observeRoot() {
  observeElement(
    ROOT_QUERY,
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
  if (select.exists(MODAL_QUERY)) {
    const modal = select(MODAL_QUERY)
    makeHarvester(modal)
  }

  const articles = select.all('article')
  for (const article of articles) {
    if (hasMedia(article)) makeHarvester(article)
  }
}

function observeStream() {
  observeElement(STREAM_QUERY, mutations => {
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
    MODAL_WRAPPER_QUERY,
    function() {
      const modalThread = select(MODAL_THREAD_QUERY)
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
