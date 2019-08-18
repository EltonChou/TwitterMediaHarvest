import './assets/css/style.sass'
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

// /**
//  * Initialize OrigClick
//  *
//  * @function piorneer
//  */
// const piorneer = () => {
//   const modal = select('[aria-labelledby = modal-header]')
//   const articles = select.all('article')
//   for (const article of articles) {
//     if (hasMedia(article)) makeOrigClick(article)
//   }
//   if (hasMedia(modal)) makeOrigClick(modal)
// }

// /**
//  * When page changed refresh the initializer.
//  *
//  * @function observeTitle
//  */
// function observeTitle() {
//   observeElement('title', () => init(), titleOptions)
// }

// /**
//  * Observe twitter stream.
//  *
//  * @function observeStream
//  */
// function observeStream() {
//   observeElement('section > div > div > div', mutations => {
//     for (const mutation of mutations) {
//       for (const addedNode of mutation.addedNodes) {
//         if (hasMedia(addedNode)) makeOrigClick(addedNode)
//       }
//     }
//   })
// }

// /**
//  * Observe media gallery.
//  *
//  * @function observeGallery
//  */
// function observeGallery() {
//   observeElement('#react-root > div > div', mutations => {
//     for (const mutation of mutations) {
//       if (mutation.addedNodes.length) {
//         makeOrigClick(mutation.target, 'insert')
//       }
//     }
//   })
// }

// /**
//  * Observe thread below the tweet in Permalink or Gallerey
//  *
//  * @function observeThread
//  */
// function observeThread() {
//   observeElement('#descendants #stream-items-id', mutations => {
//     for (const mutation of mutations) {
//       for (const addedNode of mutation.addedNodes) {
//         if (hasMedia(addedNode)) makeOrigClick(addedNode)
//       }
//     }
//   })
// }

// const observeReact = () => {
//   let tweetExist = false
//   observeElement(
//     '#react-root',
//     function(mutations) {
//       if (tweetExist) return
//       for (let mutation of mutations) {
//         for (let addedNode of mutation.addedNodes) {
//           tweetExist = select.exists('article', addedNode)
//           if (tweetExist) break
//         }
//         if (tweetExist) break
//       }
//       piorneer()
//       observeStream()
//     },
//     titleOptions
//   )
// }

const initialize = () => {
  const articles = select.all('article')
  for (let article of articles) {
    if (hasMedia(article)) makeOrigClick(article, 'insert')
  }
}

const observeStream = () => {
  observeElement('section > div > div > div', mutations => {
    for (let mutation of mutations) {
      for (let addedNode of mutation.addedNodes) {
        const article = select('article', addedNode)
        if (hasMedia(addedNode)) makeOrigClick(article, 'insert')
      }
    }
  })
}

const observeSetion = () => {
  observeElement(
    'section',
    mutations => {
      if (mutations) {
        if (select.exists('article')) {
          initialize()
          observeStream()
          // this.disconnect()
        }
      }
    },
    titleOptions
  )
}

observeElement(
  '#react-root > div > div',
  function(mutations) {
    if (mutations) {
      if (select.exists('section')) {
        observeSetion()
        // this.disconnect()
      }
    }
  },
  titleOptions
)
