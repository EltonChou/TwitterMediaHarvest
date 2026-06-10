/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
declare module 'gifshot' {
  interface GifshotOptions {
    gifWidth?: number
    gifHeight?: number
    interval?: number
    numFrames?: number
    frameDuration?: number
    video?: string[]
    sampleInterval?: number
    numWorkers?: number
  }

  interface GifshotResult {
    error: boolean
    errorCode?: string
    errorMsg?: string
    image: string
  }

  interface Gifshot {
    createGIF(
      options: GifshotOptions,
      callback: (obj: GifshotResult) => void
    ): void
    isSupported(): boolean
    isExistingVideoGIFSupported(codecs?: string[]): boolean
  }

  const gifshot: Gifshot
  export default gifshot
}
