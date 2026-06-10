/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
declare module 'gifenc' {
  type RGBAData = Uint8Array | Uint8ClampedArray

  type ColorFormat = 'rgb565' | 'rgb444' | 'rgba4444'

  /** Array of `[r, g, b]` or `[r, g, b, a]` colors in bytes. */
  type Palette = number[][]

  interface QuantizeOptions {
    format?: ColorFormat
    oneBitAlpha?: boolean | number
    clearAlpha?: boolean
    clearAlphaThreshold?: number
    clearAlphaColor?: number
  }

  interface WriteFrameOptions {
    /** Color table of the frame. Acts as the global table on the first frame. */
    palette?: Palette
    /** Frame duration in milliseconds. */
    delay?: number
    /** `-1` for play once, `0` for loop forever, `> 0` for loop count. */
    repeat?: number
    transparent?: boolean
    transparentIndex?: number
    colorDepth?: number
    dispose?: number
    first?: boolean
  }

  interface GIFEncoderInstance {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
    bytesView(): Uint8Array<ArrayBuffer>
    reset(): void
  }

  export function GIFEncoder(opts?: {
    auto?: boolean
    initialCapacity?: number
  }): GIFEncoderInstance

  export function quantize(
    rgba: RGBAData,
    maxColors: number,
    opts?: QuantizeOptions
  ): Palette

  export function applyPalette(
    rgba: RGBAData,
    palette: Palette,
    format?: ColorFormat
  ): Uint8Array
}
