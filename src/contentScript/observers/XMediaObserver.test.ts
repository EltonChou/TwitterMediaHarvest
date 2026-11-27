/**
 * @jest-environment jsdom
 */
import { sleep } from '#helpers/time'
import makeHarvester from '../core'
import XMediaObserver from './XMediaObserver'

jest.mock('../core', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../utils/checker', () => ({
  ...jest.requireActual('../utils/checker'),
  isX: jest.fn(() => true),
}))

const flush = () => sleep(0)

it('should check an article again when its video mounts later', async () => {
  document.body.innerHTML = `
  <main>
    <section><div id="urt:videos"><ul>
      <li><article>
        <a href="/someone/status/1"><time></time></a>
        <div id="media"></div>
      </article></li>
    </ul></div></section>
  </main>
  `
  const observer = new XMediaObserver()
  observer.observeRoot()
  // Mark the stream as observed so only the touched article is handled.
  observer.observeStream()
  await flush()
  expect(makeHarvester).not.toHaveBeenCalled()

  document.getElementById('media')?.append(document.createElement('video'))
  await flush()

  expect(makeHarvester).toHaveBeenCalledWith(document.querySelector('article'))
})

it('should handle every article in a thread item', async () => {
  jest.mocked(makeHarvester).mockClear()
  document.body.innerHTML = `
  <main>
    <section><div id="urt:profile"><ul></ul></div></section>
  </main>
  `
  const observer = new XMediaObserver()
  observer.observeStream()

  const item = document.createElement('li')
  item.innerHTML = [1, 2]
    .map(
      id => `
      <div><article>
        <a href="/someone/status/${id}"><time></time></a>
        <a href="/someone/status/${id}/photo/1"></a>
      </article></div>`
    )
    .join('')
  document.querySelector('ul')?.append(item)
  await flush()

  expect(makeHarvester).toHaveBeenCalledTimes(2)
})

const viewerBar = `
  <div id="viewer-bar"><div role="group">
    <button data-engagement-action="share"></button>
  </div></div>`

const mountViewerPortal = (content: string) => {
  const portal = document.createElement('div')
  portal.setAttribute('data-base-ui-portal', '')
  portal.innerHTML = `<div role="presentation">${content}</div>`
  document.body.append(portal)
  return portal
}

it('should handle the media viewer bar when its thread is collapsed', async () => {
  jest.mocked(makeHarvester).mockClear()
  document.body.innerHTML = ''
  new XMediaObserver().observeModal()

  mountViewerPortal(viewerBar)
  await sleep(50)

  expect(makeHarvester).toHaveBeenCalledWith(
    document.getElementById('viewer-bar')
  )
})

it('should handle the media viewer when its thread mounts after the portal', async () => {
  jest.mocked(makeHarvester).mockClear()
  document.body.innerHTML = ''
  new XMediaObserver().observeModal()

  // The viewer portal mounts first; the conversation loads later.
  const portal = mountViewerPortal(viewerBar)
  await flush()

  portal.firstElementChild!.insertAdjacentHTML(
    'beforeend',
    `
  <div id="urt:conversation-1"><article>
    <a href="/someone/status/1"><time></time></a>
    <a href="/someone/status/1/photo/1"></a>
  </article></div>`
  )
  await sleep(50)

  expect(makeHarvester).toHaveBeenCalledWith(portal.querySelector('article'))
})

it('should handle the media viewer thread when its media fails to load', async () => {
  jest.mocked(makeHarvester).mockClear()
  document.body.innerHTML = ''
  history.pushState(null, '', '/someone/status/1/photo/1')
  new XMediaObserver().observeModal()

  // Failed media unmounts the viewer's action bar.
  const portal = mountViewerPortal('<button>Retry</button>')
  await flush()

  portal.firstElementChild!.insertAdjacentHTML(
    'beforeend',
    `
  <div id="urt:conversation-1"><article>
    <a href="/someone/status/1/analytics"></a>
  </article></div>`
  )
  await sleep(50)
  history.pushState(null, '', '/')

  expect(makeHarvester).toHaveBeenCalledWith(portal.querySelector('article'))
})
