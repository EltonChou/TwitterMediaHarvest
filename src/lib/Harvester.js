import select from 'select-dom'
import downloadButtonSVG from '../assets/icons/twitter-download.svg'
import { checkMode } from '../utils/checker'
import {
  createElementFromHTML,
  makeButtonWithData,
  makeButtonListener,
} from '../utils/maker'
import { parseTweetInfo } from '../utils/parser'

const style = {
  stream: {
    svg:
      'r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi',
    ltr:
      'css-901oao r-1awozwy r-111h2gw r-6koalj r-1qd0xha r-a023e6 r-16dba41 r-1h0z5md r-ad9z0x r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0',
  },
  photo: {
    svg:
      'r-4qtqp9 r-yyyyoo r-50lct3 r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1srniue',
    ltr:
      'css-901oao r-1awozwy r-111h2gw r-6koalj r-1qd0xha r-a023e6 r-16dba41 r-1h0z5md r-ad9z0x r-bcqeeo r-o7ynqc r-clp7b1 r-3s2u2q r-qvutc0',
  },
}

class Harvester {
  constructor(article) {
    this.mode = checkMode(article)
    this.info = parseTweetInfo(article)
    this.button = this.makeButton()
  }

  makeButton() {
    const button = this.createButtonByMode()
    makeButtonWithData(button, this.info)
    makeButtonListener(button)
    return button
  }
  /**
   * FIXME: WTF is this shit.
   *
   * FIXME: Need to use different style in `stream`, `status`, `photo`
   * @returns {HTMLElement} Harvester
   */
  createButtonByMode() {
    const mode = this.mode
    const icon = createElementFromHTML(downloadButtonSVG)
    const iconStyle = (mode === 'stream' ? style.stream : style.photo).svg
    icon.setAttribute('class', iconStyle)

    const ltrStyle = (mode === 'photo' ? style.photo : style.stream).ltr

    const buttonWrapper = createElementFromHTML(`
      <div class="css-1dbjc4n harvester ${mode}">
        <div aria-haspopup="true" aria-label="Media Harvest" role="button" data-focusable="true" tabindex="0"
          class="css-18t94o4 css-1dbjc4n r-1777fci r-11cpok1 r-1ny4l3l r-bztko3 r-lrvibr">
          <div dir="ltr"
            class="${ltrStyle}">
            <div class="css-1dbjc4n r-xoduu5">
              <div class="css-1dbjc4n r-sdzlij r-1p0dtai r-xoduu5 r-1d2f490 r-xf4iuw r-u8s1d r-zchlnj r-ipm5af r-o7ynqc r-6416eg ${mode}BG"></div>
              ${icon.outerHTML}
            </div>
          </div>
        </div>
      </div>
    `)

    const bg = select(`.${mode}BG`, buttonWrapper)
    const ltr = select('[dir="ltr"]', buttonWrapper)

    const toggleBG = function() {
      bg.classList.toggle('hover')
      ltr.classList.toggle(`${mode}Color`)
      bg.classList.remove('click')
    }

    const clickBG = function(e) {
      bg.classList.toggle('click')
      ltr.classList.toggle('click')
      e.stopImmediatePropagation()
    }

    buttonWrapper.addEventListener('mouseover', toggleBG)
    buttonWrapper.addEventListener('mouseout', toggleBG)
    buttonWrapper.addEventListener('mouseup', clickBG)
    buttonWrapper.addEventListener('mousedown', clickBG)

    return buttonWrapper
  }
}

export default Harvester
