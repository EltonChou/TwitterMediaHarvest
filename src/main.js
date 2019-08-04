import './assets/css/style.sass'
import select from 'select-dom'
// import { observeElement } from './lib/core'
// import { makeOrigClick, hasMedia } from './lib/utils'

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

const observeElement = (element, callback, options = { childList: true }) => {
  if (select.exists(element)) {
    // eslint-disable-next-line no-undef
    const observer = new MutationObserver(callback)
    observer.observe(select(element), options)
  }
}

const initialize = () => {
  const articles = select.all('article')
}

const observeStream = () => {
  observeElement(
    '#react-root > div > div > div > main > div > div.css-1dbjc4n.r-aqfbo4.r-1niwhzg.r-16y2uox > div > div > div > div > div:nth-child(2) > div > div > div:nth-child(3) > section > div > div > div',
    function(mutations) {
      for (let mutation of mutations) {
        console.log(mutation)
      }
    }
  )
}

const observeSetion = () => {
  observeElement(
    'section',
    function(mutations) {
      if (mutations) {
        if (select.exists('article')) {
          observeStream
          this.disconnect()
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
        this.disconnect()
      }
    }
  },
  titleOptions
)
