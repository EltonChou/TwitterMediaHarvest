/**
 * @jest-environment jsdom
 */
import makeHarvester from '../core'
import XMediaObserver from './XMediaObserver'

jest.mock('../core', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../utils/checker', () => ({
  ...jest.requireActual('../utils/checker'),
  isX: jest.fn(() => true),
}))

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

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
