/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://x.com/"}
 */
import DownloadKey from './DownloadKey'
import { TweetDeckBetaKeyboardMonitor } from './tweetDeckKeyboardMonitor'
import { TwitterKeyboardMonitor } from './twitterKeyboardMonitor'
import fs from 'fs/promises'
import path from 'path'

describe.each([
  {
    KeyboardMonitor: TweetDeckBetaKeyboardMonitor,
    downloadKey: DownloadKey.BetaTweetDeck,
  },
  { KeyboardMonitor: TwitterKeyboardMonitor, downloadKey: DownloadKey.Twitter },
])(
  'unit test for twitter keyboard monitor',
  ({ KeyboardMonitor, downloadKey }) => {
    const getElement = (query: string) => {
      const element = document.querySelector(query)
      if (!element) throw new Error(`Failed to get ${query}`)
      return element as HTMLElement
    }
    const getArticle = () => getElement('#article')
    const getButton = () => getElement('#button')
    const getInput = () => getElement('#input')
    const getTextArea = () => getElement('#textArea')
    const getEditor = () => getElement('#editor')

    const keyDownEvent = new KeyboardEvent('keydown', {
      code: downloadKey,
      bubbles: true,
    })
    const keyUpEvent = new KeyboardEvent('keyup', {
      code: downloadKey,
      bubbles: true,
    })

    const mockButtonClick = jest.fn()

    const pressDownloadKeyOn = (ele: Element) => {
      ele.dispatchEvent(keyDownEvent)
      ele.dispatchEvent(keyUpEvent)
    }

    beforeAll(async () => {
      const keyboardMonitor = new KeyboardMonitor()
      const filePath = path.resolve(__dirname, 'testCases', 'article.html')
      const content = await fs.readFile(filePath, 'utf8')
      document.body.innerHTML = content

      document.addEventListener('keydown', e =>
        keyboardMonitor.handleKeyDown(e)
      )
      document.addEventListener('keyup', e => keyboardMonitor.handleKeyUp(e))

      const button = getButton()
      button.addEventListener('click', () => mockButtonClick())
    })

    afterEach(() => jest.resetAllMocks())

    it('can trigger download when the download key up', () => {
      const article = getArticle()
      article.focus()
      pressDownloadKeyOn(article)

      expect(mockButtonClick).toHaveBeenCalledTimes(1)
    })

    it.each([
      { elementName: 'input', getElement: getInput },
      { elementName: 'textarea', getElement: getTextArea },
      { elementName: 'editor', getElement: getEditor },
    ])('can ignore $elementName keyboard event', ({ getElement }) => {
      const article = getArticle()
      article.focus()
      pressDownloadKeyOn(getElement())

      expect(mockButtonClick).not.toHaveBeenCalled()
    })
  }
)
