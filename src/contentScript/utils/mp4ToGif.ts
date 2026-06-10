/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { GIFEncoder, applyPalette, quantize } from 'gifenc'

/**
 * Longest output side. Twitter renders timeline gifs at roughly 500px, while
 * encoding at the source resolution explodes both file size and encode time.
 */
const MAX_GIF_DIMENSION = 480

const FRAME_INTERVAL_SECONDS = 0.1

const MAX_FRAME_COUNT = 100

const MAX_PALETTE_SIZE = 256

/** Frames sampled across the video to build the global color palette. */
const PALETTE_SAMPLE_COUNT = 3

const CONVERSION_TIMEOUT_MS = 60_000

export type GifCapturePlan = {
  width: number
  height: number
  /** Timestamps to capture, in seconds. */
  frameTimes: number[]
  frameDelayMs: number
}

export type GifFrame = {
  /** Flat per-pixel RGBA data. */
  data: Uint8Array | Uint8ClampedArray
  width: number
  height: number
}

export const planGifCapture = (meta: {
  duration: number
  videoWidth: number
  videoHeight: number
}): GifCapturePlan => {
  const scale = Math.min(
    1,
    MAX_GIF_DIMENSION / Math.max(meta.videoWidth, meta.videoHeight)
  )

  const frameCount = Number.isFinite(meta.duration)
    ? Math.max(
        1,
        Math.min(
          MAX_FRAME_COUNT,
          Math.floor(meta.duration / FRAME_INTERVAL_SECONDS)
        )
      )
    : 1

  return {
    width: Math.max(1, Math.round(meta.videoWidth * scale)),
    height: Math.max(1, Math.round(meta.videoHeight * scale)),
    frameTimes: Array.from(
      { length: frameCount },
      (_, index) => index * FRAME_INTERVAL_SECONDS
    ),
    frameDelayMs: FRAME_INTERVAL_SECONDS * 1000,
  }
}

/**
 * Quantize a single global palette out of a few frames sampled across the
 * video. A shared palette keeps colors stable between frames and avoids the
 * per-frame local color tables that inflate the file size.
 */
const buildGlobalPalette = (frames: GifFrame[]) => {
  const sampleIndexes = new Set(
    Array.from({ length: PALETTE_SAMPLE_COUNT }, (_, index) =>
      Math.round((index * (frames.length - 1)) / (PALETTE_SAMPLE_COUNT - 1))
    )
  )

  const samples = [...sampleIndexes].map(index => frames[index].data)
  const combined = new Uint8Array(
    samples.reduce((byteCount, sample) => byteCount + sample.length, 0)
  )
  samples.reduce((offset, sample) => {
    combined.set(sample, offset)
    return offset + sample.length
  }, 0)

  return quantize(combined, MAX_PALETTE_SIZE)
}

export const encodeGifFrames = (
  frames: GifFrame[],
  frameDelayMs: number
): Uint8Array<ArrayBuffer> => {
  if (frames.length === 0) throw new Error('Cannot encode gif without frames')

  const palette = buildGlobalPalette(frames)
  const encoder = GIFEncoder()

  frames.forEach((frame, index) => {
    encoder.writeFrame(
      applyPalette(frame.data, palette),
      frame.width,
      frame.height,
      index === 0
        ? { palette, delay: frameDelayMs, repeat: 0 }
        : { delay: frameDelayMs }
    )
  })

  encoder.finish()
  return encoder.bytes()
}

const loadVideo = (url: string): Promise<HTMLVideoElement> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.preload = 'auto'
    video.addEventListener('loadeddata', () => resolve(video), { once: true })
    video.addEventListener(
      'error',
      () => reject(new Error('Failed to load video')),
      { once: true }
    )
    video.src = url
  })

const seekTo = (video: HTMLVideoElement, time: number): Promise<void> =>
  new Promise((resolve, reject) => {
    video.addEventListener('seeked', () => resolve(), { once: true })
    video.addEventListener(
      'error',
      () => reject(new Error('Failed to seek video')),
      { once: true }
    )
    video.currentTime = time
  })

const captureFrames = async (
  video: HTMLVideoElement,
  plan: GifCapturePlan
): Promise<GifFrame[]> => {
  const canvas = document.createElement('canvas')
  canvas.width = plan.width
  canvas.height = plan.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Failed to create canvas context')

  const frames: GifFrame[] = []
  for (const time of plan.frameTimes) {
    // The video is already at the first frame after `loadeddata`, and seeking
    // to the current time would never emit a `seeked` event.
    if (time !== video.currentTime) await seekTo(video, time)

    context.drawImage(video, 0, 0, plan.width, plan.height)
    frames.push(context.getImageData(0, 0, plan.width, plan.height))
  }

  return frames
}

const gifBytesToDataUrl = (bytes: Uint8Array<ArrayBuffer>): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read gif blob'))
    reader.readAsDataURL(new Blob([bytes], { type: 'image/gif' }))
  })

const convert = async (url: string): Promise<string> => {
  const video = await loadVideo(url)
  const plan = planGifCapture(video)
  const frames = await captureFrames(video, plan)
  return gifBytesToDataUrl(encodeGifFrames(frames, plan.frameDelayMs))
}

/**
 * Convert an mp4 url into a gif data url. Gif sources are mp4 files, so the
 * media has to be converted with DOM elements (video and canvas), which are
 * not available in the service worker.
 */
export const convertMp4UrlToGifDataUrl = async (
  url: string
): Promise<string> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('Gif conversion timed out')),
      CONVERSION_TIMEOUT_MS
    )
  })

  try {
    return await Promise.race([convert(url), timeout])
  } finally {
    clearTimeout(timeoutId)
  }
}
