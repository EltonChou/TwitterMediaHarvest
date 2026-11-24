/**
 * @jest-environment jsdom
 */
import { revealGridTiles } from './helper'

/** A tile of X's media grid (a `role="list"` inside one stream `li`). */
const gridTile = (sensitive: boolean) => `
  <div role="listitem">
    <div role="link">
      <a></a>
      <div>
        <div class="${sensitive ? 'size-full blur-2xl' : 'size-full'}">
          <img class="size-full" />
        </div>
        ${sensitive ? '<div class="absolute inset-0 bg-black/55">Content warning</div>' : ''}
      </div>
    </div>
  </div>`

const makeGrid = (...tiles: boolean[]) => {
  const li = document.createElement('li')
  li.innerHTML = `<div><div role="list">${tiles.map(gridTile).join('')}</div></div>`
  return li
}

describe('revealGridTiles', () => {
  it('unblurs sensitive tiles and hides their warning', () => {
    const li = makeGrid(true, true)
    revealGridTiles(li)

    li.querySelectorAll<HTMLElement>('.blur-2xl').forEach(blur => {
      expect(blur.style.filter).toBe('none')
      expect((blur.nextElementSibling as HTMLElement).style.display).toBe(
        'none'
      )
    })
  })

  it('reveals tiles appended later to the same grid', () => {
    const li = makeGrid(true)
    revealGridTiles(li)
    li.querySelector('[role="list"]')!.insertAdjacentHTML(
      'beforeend',
      gridTile(true)
    )
    revealGridTiles(li)

    const blurs = li.querySelectorAll<HTMLElement>('.blur-2xl')
    expect(blurs).toHaveLength(2)
    blurs.forEach(blur => expect(blur.style.filter).toBe('none'))
  })

  it('leaves non-sensitive tiles untouched', () => {
    const li = makeGrid(false)
    const before = li.innerHTML
    revealGridTiles(li)
    expect(li.innerHTML).toBe(before)
  })
})
