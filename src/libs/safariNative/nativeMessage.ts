/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Messages understood by `SafariWebExtensionHandler.swift` in the macOS app.
 */
export type NativeRequest =
  | {
      type: 'download'
      /** Remote http(s) URL. Omitted when `data` is given. */
      url?: string
      /** Base64 file contents, used for `blob:` and `data:` URLs. */
      data?: string
      mime?: string
      /** Path relative to the user's Downloads folder. */
      filename: string
      conflictAction: 'uniquify' | 'overwrite' | 'prompt'
    }
  | { type: 'removeFile'; path: string }
  | { type: 'notify'; id: string; title: string; message: string }

export type NativeDownloadResponse =
  | {
      ok: true
      /** Absolute path of the saved file. */
      path: string
      fileSize: number
      mime?: string
    }
  | { ok: false; error: string }

export type NativeResponse = { ok: true } | { ok: false; error: string }

/**
 * Safari ignores the application id and routes the message to the app
 * extension that contains this web extension.
 */
const APPLICATION_ID = 'app.mediaharvest.safari'

type SendNativeMessage = (
  application: string,
  message: unknown
) => Promise<unknown>

const getSender = (): SendNativeMessage => {
  const scope = globalThis as unknown as {
    browser?: { runtime?: { sendNativeMessage?: SendNativeMessage } }
  }
  const runtime = scope.browser?.runtime
  if (!runtime?.sendNativeMessage)
    throw new Error('Native messaging is not available.')
  return runtime.sendNativeMessage.bind(runtime)
}

export async function sendNativeMessage(
  request: Extract<NativeRequest, { type: 'download' }>
): Promise<NativeDownloadResponse>
export async function sendNativeMessage(
  request: Exclude<NativeRequest, { type: 'download' }>
): Promise<NativeResponse>
export async function sendNativeMessage(
  request: NativeRequest
): Promise<NativeResponse | NativeDownloadResponse> {
  try {
    const response = (await getSender()(APPLICATION_ID, request)) as
      | NativeResponse
      | NativeDownloadResponse
      | undefined
    if (!response) return { ok: false, error: 'No response from the app.' }
    return response
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
