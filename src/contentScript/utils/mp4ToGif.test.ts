/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { encodeGifFrames, planGifCapture } from './mp4ToGif'

describe('unit test for gif capture planning', () => {
  it('scales large videos down to the maximum gif dimension', () => {
    const plan = planGifCapture({
      duration: 3,
      videoWidth: 1280,
      videoHeight: 720,
    })

    expect(plan.width).toBe(480)
    expect(plan.height).toBe(270)
  })

  it('scales portrait videos by their longest side', () => {
    const plan = planGifCapture({
      duration: 3,
      videoWidth: 720,
      videoHeight: 1280,
    })

    expect(plan.width).toBe(270)
    expect(plan.height).toBe(480)
  })

  it('does not upscale small videos', () => {
    const plan = planGifCapture({
      duration: 3,
      videoWidth: 320,
      videoHeight: 240,
    })

    expect(plan.width).toBe(320)
    expect(plan.height).toBe(240)
  })

  it('captures ten frames per second', () => {
    const plan = planGifCapture({
      duration: 3,
      videoWidth: 320,
      videoHeight: 240,
    })

    expect(plan.frameDelayMs).toBe(100)
    expect(plan.frameTimes).toHaveLength(30)
    expect(plan.frameTimes[0]).toBe(0)
    expect(plan.frameTimes[1]).toBeCloseTo(0.1)
    expect(plan.frameTimes.at(-1)).toBeLessThan(3)
  })

  it('caps the total amount of frames for long videos', () => {
    const plan = planGifCapture({
      duration: 60,
      videoWidth: 320,
      videoHeight: 240,
    })

    expect(plan.frameTimes).toHaveLength(100)
  })

  it('captures a single frame when the duration is unknown', () => {
    const plan = planGifCapture({
      duration: NaN,
      videoWidth: 320,
      videoHeight: 240,
    })

    expect(plan.frameTimes).toStrictEqual([0])
  })
})

describe('unit test for gif encoding', () => {
  const makeFrame = (rgba: [number, number, number, number]) => ({
    data: new Uint8ClampedArray(Array.from({ length: 4 }, () => rgba).flat()),
    width: 2,
    height: 2,
  })

  it('encodes rgba frames into a looping gif file', () => {
    const bytes = encodeGifFrames(
      [makeFrame([255, 0, 0, 255]), makeFrame([0, 0, 255, 255])],
      100
    )

    const magic = String.fromCharCode(...bytes.slice(0, 6))
    expect(magic).toBe('GIF89a')

    const content = String.fromCharCode(...bytes)
    expect(content).toContain('NETSCAPE2.0')
  })

  it('rejects an empty frame list', () => {
    expect(() => encodeGifFrames([], 100)).toThrow(
      'Cannot encode gif without frames'
    )
  })
})
